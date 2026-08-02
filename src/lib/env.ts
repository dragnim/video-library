// Read and check import.meta.env. The rest of the app reads from here.
// Build-time config here. Runtime config (front page featured videos etc.) in config.js.

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") {
    throw new Error(
      `${name} is missing or empty. Set it in .env (or .env.local to override locally)`,
    );
  }
  return trimmed;
}

function requiredUrl(name: string, value: string | undefined): string {
  const url = required(name, value);
  try {
    new URL(url);
  } catch {
    // The api client builds requests with `new URL(base)`, which would
    // otherwise throw the same error from somewhere much less obvious.
    throw new Error(`${name} is not an absolute URL: "${url}"`);
  }
  return url;
}

/** DCMS videos collection, e.g. `https://dcms.dyalog.com/videos`. */
export const apiVideos = requiredUrl(
  "VITE_API_VIDEOS",
  import.meta.env.VITE_API_VIDEOS,
);

/** DCMS events collection. */
export const apiEvents = requiredUrl(
  "VITE_API_EVENTS",
  import.meta.env.VITE_API_EVENTS,
);

/** DCMS presenters collection. */
export const apiPresenters = requiredUrl(
  "VITE_API_PRESENTERS",
  import.meta.env.VITE_API_PRESENTERS,
);

/**
 * Path the SPA is served under — `/` in dev, `/video-library` live. The router
 * strips it from incoming URLs and re-adds it when pushing state.
 */
export const basename = required(
  "VITE_BASENAME",
  import.meta.env.VITE_BASENAME,
);

/** URL prefix for files in `public/assets` — icons and placeholder images. */
export const assetsPrefix = required(
  "VITE_ASSETS_PREFIX",
  import.meta.env.VITE_ASSETS_PREFIX,
);
