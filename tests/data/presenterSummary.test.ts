import { describe, expect, it } from "vitest";
import { summarisePresenters } from "../../src/lib/data/presenterSummary";
import type { Video } from "../../src/lib/api/types";

function video(partial: Partial<Video>): Video {
  return {
    youtubeId: "id",
    title: "A talk",
    presenterIds: [7],
    event: "Dyalog '22",
    eventSlug: "dyalog-22",
    description: "",
    thumbnail: "",
    presentedAt: null,
    publishedAt: null,
    ...partial,
  };
}

describe("summarisePresenters", () => {
  it("counts talks per presenter, crediting every presenter of a talk", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", presenterIds: [7] }),
      video({ youtubeId: "b", presenterIds: [7, 3] }),
    ]);

    expect(summaries.get(7)?.talkCount).toBe(2);
    expect(summaries.get(3)?.talkCount).toBe(1);
  });

  it("spans the presenter from their earliest talk to their latest", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", presentedAt: new Date("2019-09-08T00:00:00Z") }),
      video({ youtubeId: "b", presentedAt: new Date("2024-03-11T00:00:00Z") }),
      video({ youtubeId: "c", presentedAt: new Date("2022-10-09T00:00:00Z") }),
    ]);

    const summary = summaries.get(7);
    expect(summary?.from).toEqual(new Date("2019-09-08T00:00:00Z"));
    expect(summary?.to).toEqual(new Date("2024-03-11T00:00:00Z"));
  });

  it("ignores talks with no date when spanning the presenter", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", presentedAt: null }),
      video({ youtubeId: "b", presentedAt: new Date("2022-10-11T00:00:00Z") }),
    ]);

    expect(summaries.get(7)?.from).toEqual(new Date("2022-10-11T00:00:00Z"));
  });

  it("leaves the span null when no talk carries a date", () => {
    const summaries = summarisePresenters([video({ presentedAt: null })]);

    const summary = summaries.get(7);
    expect(summary?.from).toBeNull();
    expect(summary?.to).toBeNull();
  });

  it("ranks events by how many talks the presenter gave there", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", eventSlug: "apl-seeds-23" }),
      video({ youtubeId: "b", eventSlug: "dyalog-22" }),
      video({ youtubeId: "c", eventSlug: "dyalog-22" }),
    ]);

    expect(summaries.get(7)?.eventSlugs).toEqual(["dyalog-22", "apl-seeds-23"]);
  });

  it("breaks a tie on ascending slug, so API order cannot reorder the line", () => {
    const forwards = summarisePresenters([
      video({ youtubeId: "a", eventSlug: "dyalog-22" }),
      video({ youtubeId: "b", eventSlug: "apl-seeds-23" }),
    ]);
    const backwards = summarisePresenters([
      video({ youtubeId: "b", eventSlug: "apl-seeds-23" }),
      video({ youtubeId: "a", eventSlug: "dyalog-22" }),
    ]);

    expect(forwards.get(7)?.eventSlugs).toEqual(["apl-seeds-23", "dyalog-22"]);
    expect(backwards.get(7)?.eventSlugs).toEqual(["apl-seeds-23", "dyalog-22"]);
  });

  it("counts a talk once for a presenter it lists twice", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", presenterIds: [5, 5] }),
    ]);

    expect(summaries.get(5)?.talkCount).toBe(1);
    expect(summaries.get(5)?.eventCount).toBe(1);
  });

  it("keeps a talk that belongs to no event out of the event line", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", eventSlug: "" }),
      video({ youtubeId: "b", eventSlug: "dyalog-22" }),
    ]);

    const summary = summaries.get(7);
    expect(summary?.talkCount).toBe(2);
    expect(summary?.eventSlugs).toEqual(["dyalog-22"]);
  });

  it("drops a video crediting nobody", () => {
    const summaries = summarisePresenters([
      video({ youtubeId: "a", presenterIds: [] }),
    ]);

    expect(summaries.size).toBe(0);
  });

  it("yields nothing for no videos", () => {
    expect(summarisePresenters([]).size).toBe(0);
  });
});
