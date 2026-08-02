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

/** GET a JSON document. `T` is unchecked here; normalise.ts verifies it. */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request for ${url} failed: ${response.status}`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    // A 200 that isn't JSON is usually an upstream error page.
    throw new Error(`Response from ${url} was not JSON`);
  }
}
