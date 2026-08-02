// Smoke test for the MSW harness. Shows three things:
//
//   1. the handlers are mounted and answer on the URLs defined in `vitest.config.ts`,
//   2. they run *real* filter/paginate logic rather than returning canned bodies,
//   3. an unmocked URL fails the test loudly instead of passing quietly.

import { describe, expect, it } from "vitest";
import { apiEvents, apiPresenters, apiVideos } from "../../src/lib/env";
import type { RawEvent, RawPresenter } from "../../src/lib/api/normalise";
import type { VideoListResponse } from "./handlers";

describe("MSW harness", () => {
  it("answers on the URLs defined in vitest.config.ts", async () => {
    // Reading these from src/lib/env.ts is the check: if the pinned env values
    // and the handlers' BASE_URL drift apart, the request goes unhandled.
    const response = await fetch(apiVideos);
    expect(response.ok).toBe(true);

    const body = (await response.json()) as VideoListResponse;
    expect(body.total).toBe(15);
    expect(body.data).toHaveLength(10); // default per_page
    expect(body.data[0].youtube_id).toBe("vid001");
  });

  it("runs real filter logic, not canned responses", async () => {
    // 5 of the 15 fixture videos are dyalog-22. A canned handler would return
    // all 15 here, so this is what distinguishes the ported logic from a stub.
    const response = await fetch(`${apiVideos}?event=dyalog-22`);
    const body = (await response.json()) as VideoListResponse;

    expect(body.total).toBe(5);
    expect(body.data.map((v) => v.event_shortname)).toEqual(
      Array(5).fill("dyalog-22"),
    );
  });

  it("paginates", async () => {
    const response = await fetch(`${apiVideos}?page=2&per_page=10`);
    const body = (await response.json()) as VideoListResponse;

    expect(body.current_page).toBe(2);
    expect(body.last_page).toBe(2);
    expect(body.from).toBe(11);
    expect(body.to).toBe(15);
    expect(body.data).toHaveLength(5);
  });

  it("serves the events and presenters rosters", async () => {
    const eventsResponse = await fetch(apiEvents);
    const events = (await eventsResponse.json()) as RawEvent[];
    expect(events.map((e) => e.url_slug)).toEqual([
      "dyalog-22",
      "dyalog-23",
      "apl-quest",
    ]);

    const presentersResponse = await fetch(apiPresenters);
    const presenters = (await presentersResponse.json()) as RawPresenter[];
    expect(presenters).toHaveLength(4);
  });

  it("fails the test on an unmocked URL rather than passing quietly", async () => {
    // onUnhandledRequest: "error" makes MSW reject the request outright. Without
    // it this would resolve to something falsy and a real test would just render
    // an empty list and pass. Note this asserts a *rejection*, not a timeout.
    await expect(
      fetch("http://localhost:8081/not-a-real-endpoint"),
    ).rejects.toThrow();
  });
});
