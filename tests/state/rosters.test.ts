// The rosters turn presenter ids into names. dvl did that twice, in two places,
// from two sources; the case that matters most is the id no roster has.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { apiEvents, apiPresenters } from "../../src/lib/env";

/** Loaded once per module instance, so each case gets a fresh one. */
async function loadRosters() {
  vi.resetModules();
  const module = await import("../../src/lib/state/rosters.svelte");

  module.loadRosters();
  await vi.waitFor(() => {
    expect(module.rosters.status).not.toBe("loading");
  });

  return module.rosters;
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  server.events.removeAllListeners();
});

describe("presenter names", () => {
  it("resolves an id the roster carries", async () => {
    const rosters = await loadRosters();

    expect(rosters.presenterName(1)).toBe("John Smith");
  });

  it("leaves an id it does not carry unresolved", async () => {
    const rosters = await loadRosters();

    // The id still filters the API correctly, so the UI decides what to show.
    expect(rosters.presenterName(999)).toBeUndefined();
  });

  it("resolves nothing before the roster lands", async () => {
    vi.resetModules();
    const { rosters, loadRosters: start } =
      await import("../../src/lib/state/rosters.svelte");

    expect(rosters.status).toBe("loading");
    expect(rosters.presenterName(1)).toBeUndefined();

    start();
    await vi.waitFor(() => {
      expect(rosters.status).toBe("loaded");
    });

    // The lookup is reactive, so the name appears without anything re-fetching.
    expect(rosters.presenterName(1)).toBe("John Smith");
  });
});

describe("events", () => {
  it("looks up an event by the slug ?event= carries", async () => {
    const rosters = await loadRosters();

    expect(rosters.event("dyalog-22")).toMatchObject({
      shortname: "dyalog-22",
      fullname: "Dyalog '22",
    });
  });

  it("asks only for events that have videos", async () => {
    const seen: URL[] = [];
    server.events.on("request:start", ({ request }) => {
      seen.push(new URL(request.url));
    });

    await loadRosters();

    const events = seen.find((url) => url.href.startsWith(apiEvents));
    expect(events?.searchParams.get("has_videos")).toBe("true");
  });
});

describe("loading", () => {
  it("loads each roster once, however many callers ask", async () => {
    const seen: URL[] = [];
    server.events.on("request:start", ({ request }) => {
      seen.push(new URL(request.url));
    });

    vi.resetModules();
    const module = await import("../../src/lib/state/rosters.svelte");
    module.loadRosters();
    module.loadRosters();
    await vi.waitFor(() => {
      expect(module.rosters.status).toBe("loaded");
    });

    expect(seen).toHaveLength(2);
  });

  it("keeps the roster that arrived when the other fails", async () => {
    server.use(
      http.get(apiPresenters, () => new HttpResponse(null, { status: 500 })),
    );

    const rosters = await loadRosters();

    expect(rosters.status).toBe("failed");
    expect(rosters.presenters).toEqual([]);
    // The event menu still has something to show.
    expect(rosters.event("dyalog-22")).toBeDefined();
  });

  it("says so rather than failing silently", async () => {
    server.use(
      http.get(apiEvents, () => new HttpResponse(null, { status: 500 })),
    );

    await loadRosters();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("Roster failed to load"),
    );
  });
});
