import { describe, expect, it } from "vitest";
import { summariseEvents } from "../../src/lib/data/eventSummary";
import type { Video } from "../../src/lib/api/types";

function video(partial: Partial<Video>): Video {
  return {
    youtubeId: "id",
    title: "A talk",
    presenterIds: [],
    event: "Dyalog '22",
    eventSlug: "dyalog-22",
    description: "",
    thumbnail: "",
    presentedAt: null,
    publishedAt: null,
    ...partial,
  };
}

describe("summariseEvents", () => {
  it("counts talks per event", () => {
    const summaries = summariseEvents([
      video({ youtubeId: "a", eventSlug: "dyalog-22" }),
      video({ youtubeId: "b", eventSlug: "dyalog-22" }),
      video({ youtubeId: "c", eventSlug: "apl-seeds-23" }),
    ]);

    expect(summaries.get("dyalog-22")?.talkCount).toBe(2);
    expect(summaries.get("apl-seeds-23")?.talkCount).toBe(1);
  });

  it("spans the event from its earliest talk to its latest", () => {
    const summaries = summariseEvents([
      video({ youtubeId: "a", presentedAt: new Date("2022-10-11T00:00:00Z") }),
      video({ youtubeId: "b", presentedAt: new Date("2022-10-09T00:00:00Z") }),
      video({ youtubeId: "c", presentedAt: new Date("2022-10-12T00:00:00Z") }),
    ]);

    const summary = summaries.get("dyalog-22");
    expect(summary?.from).toEqual(new Date("2022-10-09T00:00:00Z"));
    expect(summary?.to).toEqual(new Date("2022-10-12T00:00:00Z"));
  });

  it("ignores talks with no date when spanning the event", () => {
    const summaries = summariseEvents([
      video({ youtubeId: "a", presentedAt: null }),
      video({ youtubeId: "b", presentedAt: new Date("2022-10-11T00:00:00Z") }),
    ]);

    expect(summaries.get("dyalog-22")?.from).toEqual(
      new Date("2022-10-11T00:00:00Z"),
    );
  });

  it("leaves the span null when no talk carries a date", () => {
    const summaries = summariseEvents([video({ presentedAt: null })]);

    const summary = summaries.get("dyalog-22");
    expect(summary?.from).toBeNull();
    expect(summary?.to).toBeNull();
  });

  it("ranks presenters by how many talks they gave at the event", () => {
    const summaries = summariseEvents([
      video({ youtubeId: "a", presenterIds: [7] }),
      video({ youtubeId: "b", presenterIds: [7, 3] }),
      video({ youtubeId: "c", presenterIds: [7, 3, 9] }),
      video({ youtubeId: "d", presenterIds: [3] }),
    ]);

    expect(summaries.get("dyalog-22")?.presenterIds).toEqual([3, 7, 9]);
  });

  it("breaks a tie on ascending id, so API order cannot reorder the line", () => {
    const forwards = summariseEvents([
      video({ youtubeId: "a", presenterIds: [9] }),
      video({ youtubeId: "b", presenterIds: [4] }),
    ]);
    const backwards = summariseEvents([
      video({ youtubeId: "b", presenterIds: [4] }),
      video({ youtubeId: "a", presenterIds: [9] }),
    ]);

    expect(forwards.get("dyalog-22")?.presenterIds).toEqual([4, 9]);
    expect(backwards.get("dyalog-22")?.presenterIds).toEqual([4, 9]);
  });

  it("credits a presenter once for a talk that lists them twice", () => {
    const summaries = summariseEvents([
      video({ youtubeId: "a", presenterIds: [5, 5] }),
      video({ youtubeId: "b", presenterIds: [8] }),
    ]);

    expect(summaries.get("dyalog-22")?.presenterIds).toEqual([5, 8]);
    expect(summaries.get("dyalog-22")?.presenterCount).toBe(2);
  });

  it("drops a video belonging to no event", () => {
    const summaries = summariseEvents([
      video({ youtubeId: "a", eventSlug: "" }),
      video({ youtubeId: "b", eventSlug: "dyalog-22" }),
    ]);

    expect(summaries.has("")).toBe(false);
    expect(summaries.size).toBe(1);
  });

  it("yields nothing for no videos", () => {
    expect(summariseEvents([]).size).toBe(0);
  });
});
