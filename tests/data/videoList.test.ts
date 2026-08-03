// The engine's own tests: no router, no DOM, which is what keeping history and
// scroll on the caller's side buys.

import { afterEach, describe, expect, it, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { apiVideos } from "../../src/lib/env";
import { createHarness, type Harness } from "./listHarness.svelte";

/** Every request the mock server sees, in order. */
function recordRequests() {
  const seen: URL[] = [];
  server.events.on("request:start", ({ request }) => {
    seen.push(new URL(request.url));
  });
  return seen;
}

let harness: Harness | undefined;

function start(...args: Parameters<typeof createHarness>) {
  harness = createHarness(...args);
  return harness;
}

afterEach(() => {
  harness?.cleanup();
  harness = undefined;
  server.events.removeAllListeners();
});

/** The mock library holds 15 videos. */
const TOTAL = 15;

async function settled(h: Harness) {
  await vi.waitFor(() => {
    expect(h.list.state.kind).toBe("ready");
  });
  return h.list.state;
}

describe("first load", () => {
  it("loads page one and reports the query's total", async () => {
    const h = start({ filters: { perpage: 5 } });

    expect(h.list.state.kind).toBe("loading");
    const state = await settled(h);

    expect(state).toMatchObject({ kind: "ready", total: TOTAL });
    expect(h.list.page).toBe(1);
  });

  it("is exhausted when the first page is the whole library", async () => {
    const h = start({ filters: { perpage: 100 } });

    expect(await settled(h)).toMatchObject({ exhausted: true });
  });

  it("treats no results as an empty list", async () => {
    const h = start({ filters: { q: "nonexistent" } });

    expect(await settled(h)).toMatchObject({
      kind: "ready",
      items: [],
      total: 0,
    });
  });
});

describe("infinite mode", () => {
  it("appends the next page", async () => {
    const h = start({ filters: { perpage: 5 } });
    await settled(h);

    h.list.loadMore();
    expect(h.list.state.kind).toBe("appending");

    const state = await settled(h);
    expect(state.kind === "ready" && state.items).toHaveLength(10);
    expect(h.list.page).toBe(2);
  });

  it("stops at the end", async () => {
    const h = start({ filters: { perpage: 5 } });
    await settled(h);

    for (let i = 0; i < 4; i++) {
      h.list.loadMore();
      await settled(h);
    }

    const state = await settled(h);
    expect(state.kind === "ready" && state.items).toHaveLength(TOTAL);
    expect(state).toMatchObject({ exhausted: true });
  });

  it("ignores loadMore while a page is in flight", async () => {
    const seen = recordRequests();
    const h = start({ filters: { perpage: 5 } });
    await settled(h);

    h.list.loadMore();
    h.list.loadMore();
    await settled(h);

    expect(seen).toHaveLength(2);
  });
});

describe("paged mode", () => {
  it("replaces the items rather than appending", async () => {
    const h = start({ mode: "paged", filters: { perpage: 5, page: 2 } });
    const first = await settled(h);
    const firstIds =
      first.kind === "ready" ? first.items.map((v) => v.youtubeId) : [];

    h.patch({ page: 3 });
    const second = await settled(h);

    expect(second.kind === "ready" && second.items).toHaveLength(5);
    expect(h.list.page).toBe(3);
    const secondIds =
      second.kind === "ready" ? second.items.map((v) => v.youtubeId) : [];
    expect(secondIds).not.toEqual(firstIds);
  });

  it("asks for the page it was given, without a restore", async () => {
    const seen = recordRequests();
    const h = start({ mode: "paged", filters: { perpage: 5, page: 3 } });
    await settled(h);

    expect(seen).toHaveLength(1);
    expect(seen[0].searchParams.get("page")).toBe("3");
    expect(seen[0].searchParams.get("per_page")).toBe("5");
  });

  it("does not append with loadMore", async () => {
    const h = start({ mode: "paged", filters: { perpage: 5 } });
    await settled(h);

    h.list.loadMore();

    expect(h.list.state.kind).toBe("ready");
    expect(h.list.page).toBe(1);
  });
});

describe("the reset rule", () => {
  it("starts a fresh list when a filter changes", async () => {
    const h = start({ filters: { perpage: 5 } });
    await settled(h);
    h.list.loadMore();
    await settled(h);

    h.patch({ q: "apl" });
    const state = await settled(h);

    // Page 1 of the new query, not the new query appended to the old list.
    expect(state.kind === "ready" && state.items.length).toBeLessThanOrEqual(5);
    expect(h.list.page).toBe(1);
  });

  it("does not restart when only the page changes", async () => {
    const seen = recordRequests();
    const h = start({ filters: { perpage: 5 } });
    await settled(h);
    h.list.loadMore();
    await settled(h);

    // What the engine's own ?pg= write looks like from here. Restarting would
    // load page 1, ask for ?pg=1, and go round again: an infinite request loop.
    h.patch({ page: 2 });

    expect(seen).toHaveLength(2);
    const state = h.list.state;
    expect(state.kind === "ready" && state.items).toHaveLength(10);
  });

  it("drops a response that belongs to the previous filters", async () => {
    server.use(
      http.get(apiVideos, async ({ request }) => {
        const search = new URL(request.url).searchParams.get("search");

        // The first query answers late, after the filters have moved on.
        if (search === "slow") await delay(50);

        return HttpResponse.json({
          data: [{ youtube_id: search === "slow" ? "stale" : "fresh" }],
          total: 1,
        });
      }),
    );

    const h = start({ filters: { q: "slow" } });
    h.patch({ q: "quick" });

    const state = await settled(h);
    expect(
      state.kind === "ready" && state.items.map((v) => v.youtubeId),
    ).toEqual(["fresh"]);

    // Give the stale response time to land, then confirm it did not.
    await new Promise((resolve) => setTimeout(resolve, 80));
    const after = h.list.state;
    expect(
      after.kind === "ready" && after.items.map((v) => v.youtubeId),
    ).toEqual(["fresh"]);
  });
});

describe("the one-request page restore", () => {
  it("restores pages 1..N in a single request", async () => {
    const seen = recordRequests();
    const h = start({ filters: { perpage: 5, page: 4 } });
    await settled(h);

    expect(seen).toHaveLength(1);
    expect(seen[0].searchParams.get("page")).toBe("1");
    expect(seen[0].searchParams.get("per_page")).toBe("20");
    expect(h.list.page).toBe(4);
  });

  it("falls back to fewer pages rather than one enormous request", async () => {
    const seen = recordRequests();
    // MAX_RESTORE_ITEMS is 500, so 100 a page restores 5 of them, not 500.
    const h = start({ filters: { perpage: 100, page: 500 } });
    await settled(h);

    expect(seen[0].searchParams.get("per_page")).toBe("500");
    expect(h.list.page).toBe(5);
  });
});

describe("errors", () => {
  it("keeps the items it had and leaves the page alone", async () => {
    const h = start({ filters: { perpage: 5 } });
    await settled(h);

    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );
    h.list.loadMore();

    await vi.waitFor(() => {
      expect(h.list.state.kind).toBe("error");
    });
    const state = h.list.state;
    expect(state.kind === "error" && state.items).toHaveLength(5);
    expect(state.kind === "error" && state.error.message).toMatch(
      /failed: 500/,
    );
    expect(h.list.page).toBe(1);
  });

  it("retries the same page", async () => {
    const h = start({ filters: { perpage: 5 } });
    await settled(h);

    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );
    h.list.loadMore();
    await vi.waitFor(() => {
      expect(h.list.state.kind).toBe("error");
    });

    server.resetHandlers();
    const seen = recordRequests();
    h.list.retry();

    const state = await settled(h);
    expect(seen[0].searchParams.get("page")).toBe("2");
    expect(state.kind === "ready" && state.items).toHaveLength(10);
  });

  it("does not load more while errored", async () => {
    const h = start({ filters: { perpage: 5 } });
    await settled(h);

    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );
    h.list.loadMore();
    await vi.waitFor(() => {
      expect(h.list.state.kind).toBe("error");
    });

    const seen = recordRequests();
    h.list.loadMore();

    expect(seen).toHaveLength(0);
  });
});

describe("onSettled", () => {
  it("reports the page the user is on", async () => {
    const onSettled = vi.fn();
    const h = start({ filters: { perpage: 5 }, onSettled });
    await settled(h);

    expect(onSettled).toHaveBeenLastCalledWith(1);

    h.list.loadMore();
    await settled(h);

    expect(onSettled).toHaveBeenLastCalledWith(2);
  });

  it("reports the restored page, not the page requested", async () => {
    const onSettled = vi.fn();
    const h = start({ filters: { perpage: 5, page: 3 }, onSettled });
    await settled(h);

    expect(onSettled).toHaveBeenCalledWith(3);
  });
});
