// The entity lists share one all-videos request.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { apiVideos } from "../../src/lib/env";

async function freshModule() {
  vi.resetModules();

  return await import("../../src/lib/data/summaries.svelte");
}

describe("summaries", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("summarises events and presenters from a single request", async () => {
    const requests: string[] = [];
    server.events.on("request:start", ({ request }) => {
      if (request.url.startsWith(apiVideos)) requests.push(request.url);
    });

    const { loadSummaries, summaries } = await freshModule();
    loadSummaries();
    loadSummaries();

    await vi.waitFor(() => expect(summaries.status).toBe("loaded"));

    expect(requests).toHaveLength(1);
    expect(summaries.event("dyalog-22")?.talkCount).toBe(5);
    expect(summaries.presenter(1)?.talkCount).toBe(5);
    expect(summaries.presenter(1)?.eventSlugs).toEqual([
      "dyalog-22",
      "dyalog-23",
      "apl-quest",
    ]);

    server.events.removeAllListeners();
  });

  it("leaves both lists unsummarised when the request fails", async () => {
    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { loadSummaries, summaries } = await freshModule();
    loadSummaries();

    await vi.waitFor(() => expect(summaries.status).toBe("failed"));

    expect(summaries.event("dyalog-22")).toBeUndefined();
    expect(summaries.presenter(1)).toBeUndefined();
  });
});
