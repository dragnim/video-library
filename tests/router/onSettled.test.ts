// The ordering is the point: the ?pg= write mints a new history key, so the
// restore has to read the old one first.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { location } from "../../src/lib/router/location.svelte";
import { onSettled } from "../../src/lib/router/onSettled";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function scrollTo(offset: number) {
  Object.defineProperty(window, "scrollY", {
    value: offset,
    configurable: true,
  });
  window.dispatchEvent(new Event("scroll"));
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function storedFor(key: string) {
  return sessionStorage.getItem(`vl-scroll:${key}`);
}

let scrollSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  sessionStorage.clear();
  scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the scroll offset store", () => {
  it("records where the user is, under the current history entry", async () => {
    setUrl("/");
    await scrollTo(420);

    expect(storedFor(location.key)).toBe("420");
  });

  it("keeps one offset per entry", async () => {
    setUrl("/");
    const first = location.key;
    await scrollTo(420);

    window.history.pushState({ key: "second" }, "", "/?pg=2");
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: { key: "second" } }),
    );
    await scrollTo(1200);

    expect(storedFor(first)).toBe("420");
    expect(storedFor("second")).toBe("1200");
  });
});

describe("onSettled", () => {
  it("restores the offset stored for this entry", async () => {
    setUrl("/");
    await scrollTo(640);
    scrollSpy.mockClear();

    onSettled(1);

    expect(scrollSpy).toHaveBeenCalledWith(0, 640);
  });

  it("restores before writing ?pg=, which is the order that matters", async () => {
    setUrl("/?q=apl");
    await scrollTo(900);
    const landedOn = location.key;
    scrollSpy.mockClear();

    onSettled(3);

    // Reading after the write would read the new key's empty bucket instead.
    expect(scrollSpy).toHaveBeenCalledWith(0, 900);
    expect(location.key).not.toBe(landedOn);
  });

  it("moves the viewport once per entry, not once per page", async () => {
    setUrl("/");
    await scrollTo(300);
    scrollSpy.mockClear();

    onSettled(1);
    onSettled(1);

    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the entry has no stored offset", () => {
    setUrl("/");

    onSettled(1);

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});

describe("the ?pg= write", () => {
  it("records the page reached, keeping the other filters", () => {
    setUrl("/?q=apl&sort=oldest");

    onSettled(4);

    const params = new URLSearchParams(location.search);
    expect(params.get("pg")).toBe("4");
    expect(params.get("q")).toBe("apl");
    expect(params.get("sort")).toBe("oldest");
  });

  it("leaves the first page out of the URL", () => {
    setUrl("/");
    const before = location.search;

    onSettled(1);

    expect(location.search).toBe(before);
  });

  it("replaces rather than pushes, so Back skips the paging", () => {
    setUrl("/");
    const before = window.history.length;

    onSettled(2);

    expect(window.history.length).toBe(before);
    expect(location.action).toBe("REPLACE");
  });

  it("does not scroll to the top on the write", async () => {
    setUrl("/");
    await scrollTo(500);
    scrollSpy.mockClear();

    onSettled(2);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(scrollSpy).not.toHaveBeenCalledWith(0, 0);
  });

  it("leaves the entry it minted alone on the next settle", async () => {
    setUrl("/");
    await scrollTo(500);
    scrollSpy.mockClear();

    onSettled(2);
    scrollSpy.mockClear();
    onSettled(3);

    // The position after a keepScroll write is already the one we restored.
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
