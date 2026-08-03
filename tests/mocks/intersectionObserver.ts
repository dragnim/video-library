// jsdom has no IntersectionObserver. This installs a controllable stub so tests
// can fire "the element came near the viewport" deliberately rather than waiting
// on layout that never happens.

export interface MockObserverInstance {
  callback: IntersectionObserverCallback;
  options?: IntersectionObserverInit;
  elements: Set<Element>;
  disconnected: boolean;
}

export interface MockIntersectionObserver {
  /** Every observer constructed since install, in construction order. */
  instances: MockObserverInstance[];
  /** Fires an intersecting entry for every element currently observed. */
  intersect(): void;
  /** Fires a non-intersecting entry for every element currently observed. */
  unintersect(): void;
  /** Elements observed across every live observer. */
  observedCount(): number;
  restore(): void;
}

type ObserverGlobal = {
  IntersectionObserver?: typeof IntersectionObserver;
};

export function installIntersectionObserver(): MockIntersectionObserver {
  const instances: MockObserverInstance[] = [];
  const original = (globalThis as ObserverGlobal).IntersectionObserver;

  class Stub implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string;
    readonly scrollMargin: string = "0px";
    readonly thresholds: readonly number[] = [0];
    private record: MockObserverInstance;

    constructor(
      callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      this.rootMargin = options?.rootMargin ?? "0px";
      this.record = {
        callback,
        options,
        elements: new Set<Element>(),
        disconnected: false,
      };
      instances.push(this.record);
    }

    observe(element: Element) {
      this.record.elements.add(element);
    }

    unobserve(element: Element) {
      this.record.elements.delete(element);
    }

    disconnect() {
      this.record.elements.clear();
      this.record.disconnected = true;
    }

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  (globalThis as ObserverGlobal).IntersectionObserver =
    Stub as unknown as typeof IntersectionObserver;

  function fire(isIntersecting: boolean): void {
    for (const instance of instances) {
      if (instance.disconnected || instance.elements.size === 0) continue;

      const entries = [...instance.elements].map(
        (target) =>
          ({
            target,
            isIntersecting,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          }) as IntersectionObserverEntry,
      );

      instance.callback(entries, {} as IntersectionObserver);
    }
  }

  return {
    instances,
    intersect: () => fire(true),
    unintersect: () => fire(false),
    observedCount: () =>
      instances
        .filter((instance) => !instance.disconnected)
        .reduce((count, instance) => count + instance.elements.size, 0),
    restore: () => {
      if (original) {
        (globalThis as ObserverGlobal).IntersectionObserver = original;
      } else {
        delete (globalThis as ObserverGlobal).IntersectionObserver;
      }
    },
  };
}
