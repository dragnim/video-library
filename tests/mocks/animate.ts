// jsdom implements no Web Animations API, and Svelte 5 runs every transition
// through element.animate. Without this, mounting anything with a transition
// throws "element.animate is not a function".
//
// The animation finishes on the next microtask, so an outro does not hold an
// element in the DOM for the length of a duration no test is waiting out.

export function installAnimate(): void {
  // Typed as always present, so the check is against the runtime, not the type.
  const proto: { animate?: unknown } = Element.prototype;
  if (typeof proto.animate === "function") return;

  Element.prototype.animate = function (): Animation {
    const animation = {
      currentTime: 0,
      startTime: 0,
      playbackRate: 1,
      playState: "finished",
      finished: Promise.resolve(),
      onfinish: null as (() => void) | null,
      effect: {
        getComputedTiming: () => ({ delay: 0, duration: 0 }),
      },
      play() {},
      pause() {},
      cancel() {},
      finish() {},
      addEventListener() {},
      removeEventListener() {},
    };

    queueMicrotask(() => animation.onfinish?.());

    return animation as unknown as Animation;
  };
}
