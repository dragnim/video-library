// Most of these assert the outgoing request: the param mapping and the two
// params that are omitted when empty.

import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { apiVideos } from "../../src/lib/env";
import {
  getRecommendations,
  getVideo,
  listVideos,
} from "../../src/lib/api/videos";
import { DEFAULT_FILTERS } from "../../src/lib/utils/browseFilters";

/** Intercepts the next request and hands back its query params. */
function captureRequest() {
  let captured: URL | undefined;

  server.use(
    http.get(apiVideos, ({ request }) => {
      captured = new URL(request.url);
      return HttpResponse.json({ data: [], total: 0 });
    }),
  );

  return () => {
    if (!captured) throw new Error("no request was made");
    return captured.searchParams;
  };
}

const FIRST_PAGE = { page: 1, perpage: 18 };

describe("listVideos", () => {
  it("maps every filter to the name the API uses", async () => {
    const sent = captureRequest();

    await listVideos(
      {
        ...DEFAULT_FILTERS,
        q: "apl",
        sort: "oldest",
        event: "dyalog-22",
        presenterIds: [1, 3],
        from: "2020-01-01",
        to: "2023-12-31",
      },
      { page: 2, perpage: 20 },
    );

    const params = sent();
    expect(params.get("search")).toBe("apl");
    expect(params.get("page")).toBe("2");
    expect(params.get("per_page")).toBe("20");
    expect(params.get("sort")).toBe("oldest");
    expect(params.get("presenter_id")).toBe("1,3");
    expect(params.get("from")).toBe("2020-01-01");
    expect(params.get("to")).toBe("2023-12-31");
    expect(params.get("event")).toBe("dyalog-22");
  });

  it("omits an empty event rather than sending event=", async () => {
    const sent = captureRequest();

    await listVideos({ ...DEFAULT_FILTERS, event: "" }, FIRST_PAGE);

    // An empty event filters every video out (Jarvis issue 115).
    expect(sent().has("event")).toBe(false);
  });

  it("omits an empty presenter_id too, which dvl always sent", async () => {
    const sent = captureRequest();

    await listVideos({ ...DEFAULT_FILTERS, presenterIds: [] }, FIRST_PAGE);

    expect(sent().has("presenter_id")).toBe(false);
  });

  it("asks for the size it is given, not the size in the filters", async () => {
    const sent = captureRequest();

    // A page restore: one request covering pages 1..5.
    await listVideos(
      { ...DEFAULT_FILTERS, page: 5, perpage: 18 },
      { page: 1, perpage: 90 },
    );

    const params = sent();
    expect(params.get("page")).toBe("1");
    expect(params.get("per_page")).toBe("90");
  });

  it("returns normalised videos and the query's own total", async () => {
    const page = await listVideos(
      { ...DEFAULT_FILTERS, event: "dyalog-22" },
      FIRST_PAGE,
    );

    // total counts every match for the query.
    expect(page.total).toBeGreaterThan(0);
    expect(page.items.length).toBeLessThanOrEqual(page.total);
    for (const video of page.items) {
      expect(video.eventSlug).toBe("dyalog-22");
      expect(video.youtubeId).not.toBe("");
    }
  });

  it("reports an empty result as an empty list, not a failure", async () => {
    const page = await listVideos(
      { ...DEFAULT_FILTERS, q: "nonexistent" },
      FIRST_PAGE,
    );

    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
  });

  it("survives a narrowed payload, since the API may return fewer fields", async () => {
    server.use(
      http.get(apiVideos, () =>
        HttpResponse.json({ data: [{ youtube_id: "vid001" }], total: 1 }),
      ),
    );

    const page = await listVideos(DEFAULT_FILTERS, FIRST_PAGE);

    expect(page.items[0]).toMatchObject({
      youtubeId: "vid001",
      title: "",
      presenterIds: [],
      description: "",
      presentedAt: null,
    });
    expect(page.items[0].thumbnail).not.toBe("");
  });

  it("rejects rather than resolving empty when the request fails", async () => {
    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(listVideos(DEFAULT_FILTERS, FIRST_PAGE)).rejects.toThrow(
      /failed: 500/,
    );
  });
});

describe("getVideo", () => {
  it("returns one normalised video", async () => {
    const video = await getVideo("vid001");

    expect(video.youtubeId).toBe("vid001");
    expect(video.title).not.toBe("");
    expect(video.presentedAt).toBeInstanceOf(Date);
  });

  it("rejects when the API has no such video", async () => {
    await expect(getVideo("notfound")).rejects.toThrow(/failed: 404/);
  });

  it("carries the status, so a missing video reads apart from a dead API", async () => {
    await expect(getVideo("notfound")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
    });
  });

  it("escapes the id rather than pasting it into the path", async () => {
    let path = "";
    server.use(
      http.get(`${apiVideos}/:id`, ({ request }) => {
        path = new URL(request.url).pathname;
        return HttpResponse.json({ youtube_id: "x" });
      }),
    );

    await getVideo("a/b?c");

    expect(path.endsWith("/a%2Fb%3Fc")).toBe(true);
  });
});

describe("getRecommendations", () => {
  it("asks for the count it is given", async () => {
    let params: URLSearchParams | undefined;
    server.use(
      http.get(`${apiVideos}/:id/recommendations`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json([]);
      }),
    );

    await getRecommendations("vid001", 8);

    expect(params?.get("n")).toBe("8");
  });

  it("returns normalised videos from a plain array", async () => {
    const videos = await getRecommendations("vid001", 8);

    expect(videos.length).toBeGreaterThan(0);
    for (const video of videos) {
      expect(video.youtubeId).not.toBe("");
      expect(video.thumbnail).not.toBe("");
    }
  });

  it("drops rows with no id, which could not be linked to", async () => {
    server.use(
      http.get(`${apiVideos}/:id/recommendations`, () =>
        HttpResponse.json([{ youtube_id: "rec1" }, { title: "orphan" }]),
      ),
    );

    const videos = await getRecommendations("vid001", 8);

    expect(videos.map((video) => video.youtubeId)).toEqual(["rec1"]);
  });
});
