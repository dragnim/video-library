// A failed request must throw rather than resolve to something empty, and
// buildUrl must omit what it should.

import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { apiVideos } from "../../src/lib/env";
import { buildUrl, fetchJson } from "../../src/lib/api/client";

describe("fetchJson", () => {
  it("returns the parsed body on success", async () => {
    const body = await fetchJson<{ total: number; data: unknown[] }>(apiVideos);

    expect(body.total).toBe(15);
    expect(body.data).toHaveLength(10);
  });

  it("throws on a 500, naming the status and the URL", async () => {
    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );

    // dvl renders an empty list here: a broken API looks like an empty library.
    await expect(fetchJson(apiVideos)).rejects.toThrow(/failed: 500/);
    await expect(fetchJson(apiVideos)).rejects.toThrow(apiVideos);
  });

  it("throws on a 200 that is not JSON", async () => {
    server.use(http.get(apiVideos, () => HttpResponse.text("<html>oops")));

    await expect(fetchJson(apiVideos)).rejects.toThrow(/was not JSON/);
  });
});

describe("buildUrl", () => {
  it("sets the parameters it is given", () => {
    const url = new URL(
      buildUrl(apiVideos, { search: "apl", page: 2, sort: "newest" }),
    );

    expect(url.searchParams.get("search")).toBe("apl");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("sort")).toBe("newest");
  });

  it("comma-joins arrays", () => {
    const url = new URL(buildUrl(apiVideos, { presenter_id: [3, 7] }));

    expect(url.searchParams.get("presenter_id")).toBe("3,7");
  });

  it("omits empty strings, empty arrays and undefined", () => {
    // An empty `event` filters out every video rather than none.
    const url = new URL(
      buildUrl(apiVideos, {
        event: "",
        presenter_id: [],
        from: undefined,
        search: "apl",
      }),
    );

    expect(url.searchParams.has("event")).toBe(false);
    expect(url.searchParams.has("presenter_id")).toBe(false);
    expect(url.searchParams.has("from")).toBe(false);
    expect(url.search).toBe("?search=apl");
  });

  it("keeps 0 and false, which are values rather than absences", () => {
    const url = new URL(buildUrl(apiVideos, { page: 0, has_videos: false }));

    expect(url.searchParams.get("page")).toBe("0");
    expect(url.searchParams.get("has_videos")).toBe("false");
  });

  it("encodes values", () => {
    const url = buildUrl(apiVideos, { search: "apl & j" });

    expect(url).toContain("search=apl+%26+j");
  });

  it("takes no parameters at all", () => {
    expect(buildUrl(apiVideos)).toBe(`${apiVideos}`);
  });
});
