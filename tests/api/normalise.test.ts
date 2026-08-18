// Missing fields must get usable defaults, and dates must keep their day.

import { describe, expect, it } from "vitest";
import { assetsPrefix } from "../../src/lib/env";
import {
  normaliseEvents,
  normalisePresenters,
  normaliseVideo,
  normaliseVideoPage,
  type RawVideo,
} from "../../src/lib/api/normalise";

const fullVideo: RawVideo = {
  youtube_id: "vid001",
  title: "Introduction to APL",
  presenter: "John Smith",
  presenter_id: [1],
  event: "Dyalog '22",
  event_shortname: "dyalog-22",
  presented_at: "2022-09-11 00:00:00",
  published_at: "2022-09-15 10:30:00",
  description: "Learn APL basics",
  thumbnail: "https://i.ytimg.com/vi/vid001/hqdefault.jpg",
};

describe("normaliseVideo", () => {
  it("maps a complete row", () => {
    expect(normaliseVideo(fullVideo)).toEqual({
      youtubeId: "vid001",
      title: "Introduction to APL",
      presenterIds: [1],
      event: "Dyalog '22",
      eventSlug: "dyalog-22",
      description: "Learn APL basics",
      thumbnail: "https://i.ytimg.com/vi/vid001/hqdefault.jpg",
      presentedAt: new Date("2022-09-11T00:00:00Z"),
      publishedAt: new Date("2022-09-15T10:30:00Z"),
    });
  });

  it("defaults every field when the payload is empty", () => {
    expect(normaliseVideo({})).toEqual({
      youtubeId: "",
      title: "Untitled video",
      presenterIds: [],
      event: "",
      eventSlug: "",
      description: "",
      thumbnail: `${assetsPrefix}/placeholder.png`,
      presentedAt: null,
      publishedAt: null,
    });
  });

  it.each([
    ["missing", {}],
    ["empty", { title: "" }],
    ["whitespace", { title: "   " }],
  ])("names a %s title rather than rendering an empty heading", (_, raw) => {
    // One live row has title: "", which showed as a card with no name.
    expect(normaliseVideo(raw).title).toBe("Untitled video");
  });

  it("returns null rather than an Invalid Date", () => {
    const video = normaliseVideo({
      presented_at: "yesterday",
      published_at: "",
    });

    expect(video.presentedAt).toBeNull();
    expect(video.publishedAt).toBeNull();
  });
});

describe("normaliseVideo dates", () => {
  it("reads the API's format as UTC, keeping the calendar day", () => {
    // Read as local time this lands on 2024-12-31 west of UTC.
    const video = normaliseVideo({ presented_at: "2025-01-01 00:00:00" });

    expect(video.presentedAt?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("takes a date with no time", () => {
    expect(
      normaliseVideo({ presented_at: "2025-07-01" }).presentedAt?.toISOString(),
    ).toBe("2025-07-01T00:00:00.000Z");
  });

  it("still takes a real ISO 8601 string", () => {
    expect(
      normaliseVideo({
        published_at: "2022-09-15T10:30:00Z",
      }).publishedAt?.toISOString(),
    ).toBe("2022-09-15T10:30:00.000Z");
  });
});

describe("normaliseVideo presenters", () => {
  it("passes the ids through", () => {
    expect(
      normaliseVideo({
        presenter: "John Smith, Jane Doe",
        presenter_id: [1, 2],
      }).presenterIds,
    ).toEqual([1, 2]);
  });

  it("has no ids when the field is absent", () => {
    expect(normaliseVideo({ presenter: "John Smith" }).presenterIds).toEqual(
      [],
    );
  });
});

describe("normaliseVideoPage", () => {
  it("keeps the server's total", () => {
    const page = normaliseVideoPage({ data: [fullVideo], total: 631 });

    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(631);
  });

  it("counts the items when total is absent", () => {
    expect(normaliseVideoPage({ data: [fullVideo, fullVideo] }).total).toBe(2);
  });

  it("no results is an empty page, not a falsy value", () => {
    expect(normaliseVideoPage({ data: [], total: 0 })).toEqual({
      items: [],
      total: 0,
    });
    expect(normaliseVideoPage({})).toEqual({ items: [], total: 0 });
  });

  it("drops rows with no youtube_id", () => {
    const page = normaliseVideoPage({
      data: [fullVideo, { title: "No id here" }],
      total: 2,
    });

    expect(page.items.map((video) => video.youtubeId)).toEqual(["vid001"]);
  });
});

describe("roster normalisation", () => {
  it("renames the event fields and drops rows with no id", () => {
    expect(
      normaliseEvents([
        {
          id: 1,
          title: "Dyalog '22",
          url_slug: "dyalog-22",
          type: "Dyalog User Meeting",
          start: "",
          end: "",
          has_videos: true,
        },
        { title: "Nameless" },
      ]),
    ).toEqual([
      {
        id: 1,
        shortname: "dyalog-22",
        fullname: "Dyalog '22",
        type: "Dyalog User Meeting",
      },
    ]);
  });

  it("defaults missing event strings", () => {
    expect(normaliseEvents([{ id: 2 }])).toEqual([
      { id: 2, shortname: "", fullname: "", type: "" },
    ]);
  });

  it("keeps presenters with an id and drops the rest", () => {
    expect(
      normalisePresenters([
        { id: 1, name: "John Smith" },
        { id: 2 },
        { name: "Nobody" },
      ]),
    ).toEqual([
      { id: 1, name: "John Smith" },
      { id: 2, name: "" },
    ]);
  });
});
