// The open rule: what the user last said, and the filters they said it about.
// No component and no effect, so no $effect.root and no flushSync — every case
// drives the URL and reads searchPanel.open.

import { beforeEach, describe, expect, it, vi } from "vitest";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

/**
 * A session of its own per case. The remembered choice is module state that
 * outlives a single URL by design, so a fresh module is what isolates one case
 * from the next.
 */
async function coldLoad(url: string) {
  setUrl(url);
  vi.resetModules();
  return (await import("../../src/lib/state/searchPanel.svelte")).searchPanel;
}

beforeEach(() => {
  setUrl("/");
});

describe("a cold load", () => {
  it.each([
    "/?presenter_id=12",
    "/?event=dyalog-22",
    "/?from=2019-01-01",
    "/?to=2024-12-31",
  ])(
    "opens the panel for %s, so the controls behind it are visible",
    async (url) => {
      const searchPanel = await coldLoad(url);

      expect(searchPanel.open).toBe(true);
    },
  );

  it("leaves it closed with none of them set", async () => {
    const searchPanel = await coldLoad("/?q=apl&sort=oldest&pg=3&perpage=40");

    expect(searchPanel.open).toBe(false);
  });
});

describe("the toggle", () => {
  it("opens and closes it with nothing set", async () => {
    const searchPanel = await coldLoad("/");

    searchPanel.toggle();
    expect(searchPanel.open).toBe(true);

    searchPanel.toggle();
    expect(searchPanel.open).toBe(false);
  });
});

describe("a dismissal", () => {
  it("holds while sort, perpage, pg and q change", async () => {
    const searchPanel = await coldLoad("/?presenter_id=7");
    searchPanel.open = false;

    setUrl("/?presenter_id=7&sort=oldest&perpage=40&pg=3&q=apl");

    expect(searchPanel.open).toBe(false);
  });

  it("ends when the advanced subset next changes", async () => {
    const searchPanel = await coldLoad("/?presenter_id=7");
    searchPanel.open = false;

    setUrl("/?presenter_id=7,9");

    expect(searchPanel.open).toBe(true);
  });

  it("does not answer for filters it was not about", async () => {
    // A presenter credit clicked while the panel was closed by hand.
    const searchPanel = await coldLoad("/");
    searchPanel.open = false;

    setUrl("/?presenter_id=7");

    expect(searchPanel.open).toBe(true);
  });
});
