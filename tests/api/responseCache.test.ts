// The API sends no cache-control, so this cache is the only thing stopping a
// tab click from re-requesting a list the app already has.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import { apiVideos } from "../../src/lib/env";
import { fetchJson, RESPONSE_TTL_MS } from "../../src/lib/api/client";

let served = 0;

beforeEach(() => {
  served = 0;
  server.use(
    http.get(apiVideos, () => {
      served += 1;
      return HttpResponse.json({ served });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the response cache", () => {
  it("serves a second call from the first response", async () => {
    const first = await fetchJson<{ served: number }>(apiVideos);
    const second = await fetchJson<{ served: number }>(apiVideos);

    expect(served).toBe(1);
    expect(second).toEqual(first);
  });

  it("shares one request between callers that arrive before it lands", async () => {
    const [first, second] = await Promise.all([
      fetchJson<{ served: number }>(apiVideos),
      fetchJson<{ served: number }>(apiVideos),
    ]);

    expect(served).toBe(1);
    expect(second).toBe(first);
  });

  it("keys on the whole URL, so a different query is a different request", async () => {
    await fetchJson(`${apiVideos}?page=1`);
    await fetchJson(`${apiVideos}?page=2`);

    expect(served).toBe(2);
  });

  it("requests again once the entry has expired", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    await fetchJson(apiVideos);
    vi.advanceTimersByTime(RESPONSE_TTL_MS + 1);
    await fetchJson(apiVideos);

    expect(served).toBe(2);
  });

  it("does not cache a failure", async () => {
    server.use(
      http.get(apiVideos, () => {
        served += 1;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(fetchJson(apiVideos)).rejects.toThrow(/failed: 500/);
    await expect(fetchJson(apiVideos)).rejects.toThrow(/failed: 500/);

    expect(served).toBe(2);
  });

  it("caches the recovery after a failure", async () => {
    server.use(
      http.get(apiVideos, () => {
        served += 1;
        return served === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json({ served });
      }),
    );

    await expect(fetchJson(apiVideos)).rejects.toThrow(/failed: 500/);
    await fetchJson(apiVideos);
    await fetchJson(apiVideos);

    expect(served).toBe(2);
  });
});
