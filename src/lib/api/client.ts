// Call data APIs.

/** Arrays are comma-joined, as `presenter_id` expects. */
type ParamValue = string | number | boolean | number[] | string[] | undefined;

/**
 * Build a request URL. Empty values are omitted, `0` and `false` are not: an
 * empty `event` filters out every video (Dyalog/Jarvis issue 115).
 */
export function buildUrl(
  base: string,
  params: Record<string, ParamValue> = {},
): string {
  const url = new URL(base);

  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length !== 0) url.searchParams.set(name, value.join(","));
    } else if (value !== "") {
      url.searchParams.set(name, String(value));
    }
  }

  return url.href;
}

/**
 * A request that reached the API and came back an error. `status` is what lets
 * a caller tell a 404 from a network failure: `/watch?v=` for a deleted video
 * has to say the video is gone, not that the library is down.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`Request for ${url} failed: ${status}`);
    this.name = "ApiError";
  }
}

/**
 * How long a response is reused for. The API sends no `cache-control` and no
 * `etag`, so without this every tab click re-requests a list the app already
 * has, at 5 to 50 seconds a request. A video joins the library every few weeks,
 * so minutes of staleness costs nothing a reload does not fix.
 */
export const RESPONSE_TTL_MS = 5 * 60 * 1000;

interface Entry {
  promise: Promise<unknown>;
  /** When the response landed. Null while in flight, which never expires. */
  settledAt: number | null;
}

const cache = new Map<string, Entry>();

function fresh(entry: Entry): boolean {
  return (
    entry.settledAt === null || Date.now() - entry.settledAt < RESPONSE_TTL_MS
  );
}

/**
 * GET a JSON document. `T` is unchecked here; normalise.ts verifies it.
 *
 * Two callers of one URL share one request, whether or not the first has
 * landed.
 */
export function fetchJson<T>(url: string): Promise<T> {
  const hit = cache.get(url);
  if (hit && fresh(hit)) return hit.promise as Promise<T>;

  const entry: Entry = { promise: get<T>(url), settledAt: null };
  cache.set(url, entry);

  entry.promise.then(
    () => {
      entry.settledAt = Date.now();
    },
    // A failure has to stay retryable, so it is never what the cache holds.
    () => {
      if (cache.get(url) === entry) cache.delete(url);
    },
  );

  return entry.promise as Promise<T>;
}

/** For tests, which need each case to reach the API. */
export function clearResponseCache(): void {
  cache.clear();
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(response.status, url);
  }

  try {
    return (await response.json()) as T;
  } catch {
    // A 200 that isn't JSON is usually an upstream error page.
    throw new Error(`Response from ${url} was not JSON`);
  }
}
