// Where the app is, and the one way to change it.

import { basename as configuredBasename } from "../env";

type NavigationAction = "PUSH" | "REPLACE" | "POP";

interface HistoryState {
  key: string;
}

/** Normalised to "" at the root, so every URL is `basename + pathname`. */
const basename = configuredBasename.replace(/\/+$/, "");

/**
 * `action` has no counterpart in the native history API, and the scroll policy
 * needs it to leave back/forward alone. `key` identifies the history entry,
 * which is what the scroll restore keys its stored positions by.
 */
export const location = $state({
  pathname: stripBasename(window.location.pathname),
  search: window.location.search,
  action: "POP" as NavigationAction,
  key: ensureKey(),
});

/**
 * Navigate to `url`, a basename-free `pathname?search` string. `replace: true`
 * uses replaceState instead of pushState, so it doesn't grow history.length.
 */
export function navigate(
  url: string,
  options: { replace?: boolean } = {},
): void {
  const { pathname, search } = splitUrl(url);
  const key = createKey();
  const state: HistoryState = { key };
  const href = addBasename(pathname) + search;

  if (options.replace) {
    window.history.replaceState(state, "", href);
  } else {
    window.history.pushState(state, "", href);
  }

  location.pathname = pathname;
  location.search = search;
  location.action = options.replace ? "REPLACE" : "PUSH";
  location.key = key;
}

window.addEventListener("popstate", () => {
  location.pathname = stripBasename(window.location.pathname);
  location.search = window.location.search;
  location.action = "POP";
  location.key = ensureKey();
});

/** Browser pathname to app pathname. Idempotent: app paths pass through. */
export function stripBasename(pathname: string): string {
  if (basename === "") return pathname;
  if (pathname === basename) return "/";
  if (pathname.startsWith(`${basename}/`))
    return pathname.slice(basename.length);
  return pathname;
}

/** App pathname to browser pathname. */
export function addBasename(pathname: string): string {
  if (basename === "") return pathname;
  return pathname === "/" ? basename : `${basename}${pathname}`;
}

/** Splits a `pathname?search` string; `URL` needs a base for the relative form. */
function splitUrl(url: string): { pathname: string; search: string } {
  const parsed = new URL(url, "http://dummy-base.invalid");
  return { pathname: parsed.pathname, search: parsed.search };
}

function createKey(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * The key of the current entry, seeded when it has none. Entries we did not
 * push arrive with `history.state === null` — the initial load, and anything
 * from before a reload. Returning to one twice has to yield the same key, so
 * a seeded key is written back rather than only returned.
 */
function ensureKey(): string {
  const existing = window.history.state as HistoryState | null;
  if (existing?.key) return existing.key;

  const key = createKey();
  const state: HistoryState = { key };
  window.history.replaceState(state, "", window.location.href);
  return key;
}
