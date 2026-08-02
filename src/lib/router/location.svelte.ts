// Location history and routing.

import { basename } from "../env";

type NavigationAction = "PUSH" | "REPLACE" | "POP";

interface HistoryState {
  key: string;
}

/** dvl reads history.action to skip scroll-to-top on back/forward (2.3). */
export const location = $state({
  pathname: stripBasename(window.location.pathname),
  search: window.location.search,
  action: "POP" as NavigationAction,
  key: seedKey(),
});

/**
 * Navigate to `url` (a full `pathname?search` string). `replace: true` uses
 * replaceState instead of pushState, so it doesn't grow history.length.
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

window.addEventListener("popstate", (event) => {
  const state = event.state as HistoryState | null;
  location.pathname = stripBasename(window.location.pathname);
  location.search = window.location.search;
  location.action = "POP";
  location.key = state?.key ?? createKey();
});

function stripBasename(pathname: string): string {
  if (basename === "/") return pathname; // Base case: keep leading slash for paths
  if (pathname === basename) return "/";
  if (pathname.startsWith(`${basename}/`))
    return pathname.slice(basename.length);
  return pathname;
}

function addBasename(pathname: string): string {
  if (basename === "/") return pathname;
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
 * The first entry loads with history.state === null. Seed it with a key so
 * Phase 3's scroll restore (keyed like react-router's location.key) has
 * something to key the initial entry by.
 */
function seedKey(): string {
  const existing = window.history.state as HistoryState | null;
  if (existing?.key) return existing.key;

  const key = createKey();
  window.history.replaceState({ key }, "", window.location.href);
  return key;
}
