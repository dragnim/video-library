/**
 * The single home for the video library's URL parameter vocabulary.
 *
 * The URL is canonical. `state/filters.svelte.ts` derives live filters from it
 * for every consumer that reads them — the browse bar, infinite grid,
 * advanced-search panel, chips and Pagination — and the advanced-search
 * panel's rerun writes back through serialiseFilters. One parser and one
 * serialiser keep those consumers from drifting apart.
 *
 * URL names are `q, pg, perpage, sort, from, to, presenter_id, event`.
 * The names on BrowseFilters are the app-facing ones.
 *
 * This vocabulary is exhaustive: a round trip through
 * parseFilters/serialiseFilters **drops every other query param**, including
 * `utm_*`. That is deliberate — the URL is the filter state — but it means
 * anything that needs to survive a filter change has to be added here.
 */

export interface BrowseFilters {
  q: string;
  sort: string;
  event: string;
  presenterIds: number[];
  from: string;
  to: string;
  page: number;
  perpage: number;
}

/** The API's `sort` accepts nothing else. */
export const VALID_SORTS = ["relevance", "newest", "oldest"];

/**
 * What each surface offers, in the order it offers them. Browsing has no query
 * for a result to be relevant to, so date order is the only choice it makes
 * sense to hand someone there; `relevance` stays valid in the URL either way.
 */
export const BROWSE_SORTS = ["newest", "oldest"];
export const SEARCH_SORTS = ["relevance", "newest", "oldest"];

export function normaliseSort(sort: string | null | undefined): string {
  if (!sort) return DEFAULT_FILTERS.sort;
  return VALID_SORTS.indexOf(sort) === -1 ? DEFAULT_FILTERS.sort : sort;
}

/**
 * Routes that render a filtered list of videos, and can therefore honour a
 * filter change in place.
 *
 * The advanced-search panel's auto-rerun writes to the route the user is on
 * when it appears here, and falls back to /search when it does not — changing
 * a filter has to lead somewhere that shows the result.
 *
 * /events and /presenters list entities rather than videos and link into
 * /search, so they stay off this list deliberately.
 */
export const RESULT_ROUTES = ["/search", "/"];

export function rerunPathFor(pathname: string): string {
  return RESULT_ROUTES.indexOf(pathname) === -1 ? "/search" : pathname;
}

export const DEFAULT_FILTERS: BrowseFilters = {
  q: "",
  sort: "newest",
  event: "",
  presenterIds: [],
  from: "",
  to: "",
  page: 1,
  // Six 3-column rows.
  perpage: 18,
};

/**
 * Ceilings on the two params that turn into request size.
 *
 * `per_page` is uncapped server-side, which is what makes the list engine's
 * one-request page restore possible — and equally what makes a hand-edited
 * or stale `?pg=5000&perpage=500` a single request for 2.5M rows. The library
 * holds 631 videos, so these are far above anything reachable by using the UI.
 */
export const MAX_PERPAGE = 100;
export const MAX_PAGE = 500;

function positiveInt(
  raw: string | null,
  fallback: number,
  max: number,
): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export function clampPerpage(perpage: number): number {
  if (!Number.isFinite(perpage) || perpage < 1) return DEFAULT_FILTERS.perpage;
  return Math.min(Math.floor(perpage), MAX_PERPAGE);
}

export function parseFilters(search: string): BrowseFilters {
  // URLSearchParams strips a single leading "?" itself.
  const params = new URLSearchParams(search);

  return {
    q: params.get("q") ?? DEFAULT_FILTERS.q,
    sort: normaliseSort(params.get("sort")),
    event: params.get("event") ?? DEFAULT_FILTERS.event,
    presenterIds: (params.get("presenter_id") ?? "")
      .split(",")
      .map((id) => Number.parseInt(id.trim(), 10))
      .filter((id) => !Number.isNaN(id)),
    from: params.get("from") ?? DEFAULT_FILTERS.from,
    to: params.get("to") ?? DEFAULT_FILTERS.to,
    page: positiveInt(params.get("pg"), DEFAULT_FILTERS.page, MAX_PAGE),
    perpage: positiveInt(
      params.get("perpage"),
      DEFAULT_FILTERS.perpage,
      MAX_PERPAGE,
    ),
  };
}

/** The subset of the vocabulary the advanced-search panel owns. */
export function hasAdvancedFilters(filters: BrowseFilters): boolean {
  return (
    filters.event !== "" ||
    filters.presenterIds.length !== 0 ||
    filters.from !== "" ||
    filters.to !== ""
  );
}

/**
 * The advanced subset as one comparable string. Two filter states with the same
 * signature are the same question, so a change to `sort` or `pg` is not one.
 *
 * `serialiseFilters` is not reused here: it also emits `sort`, `pg` and
 * `perpage`, and a signature that moved when the sort changed would reopen a
 * panel the user had dismissed.
 */
export function advancedSignature(filters: BrowseFilters): string {
  return [
    filters.event,
    filters.presenterIds.join(","),
    filters.from,
    filters.to,
  ].join("|");
}

/**
 * Unspecified fields fall back to the defaults.
 *
 * `pg`, `sort` and `perpage` are always emitted and the rest only when they
 * carry a value — which is exactly what dvl's performSearch has always
 * written, so /search URLs are unchanged. Param order matches too, to keep
 * URL churn to a minimum.
 */
export function serialiseFilters(
  filters: Partial<BrowseFilters>,
): URLSearchParams {
  const f: BrowseFilters = { ...DEFAULT_FILTERS, ...filters };
  const params = new URLSearchParams();

  if (f.q !== "") params.set("q", f.q);
  params.set("pg", String(f.page));
  if (f.from !== "") params.set("from", f.from);
  if (f.to !== "") params.set("to", f.to);
  if (f.presenterIds.length !== 0) {
    params.set("presenter_id", f.presenterIds.join(","));
  }
  // Validated on the way out as well as in, so the round-trip holds even for
  // a caller that hands us a sort the API would reject.
  params.set("sort", normaliseSort(f.sort));
  params.set("perpage", String(clampPerpage(f.perpage)));
  if (f.event !== "") params.set("event", f.event);

  return params;
}
