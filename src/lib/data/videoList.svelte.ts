// One list of videos, browsed infinitely or a page at a time.

import { untrack } from "svelte";
import type { Video } from "../api/types";
import { listVideos } from "../api/videos";
import {
  clampPerpage,
  MAX_PERPAGE,
  serialiseFilters,
  type BrowseFilters,
} from "../utils/browseFilters";

export type ListMode = "infinite" | "paged";

export type ListState =
  | { kind: "loading" }
  | { kind: "ready"; items: Video[]; total: number; exhausted: boolean }
  | { kind: "appending"; items: Video[]; total: number }
  | { kind: "error"; error: Error; items: Video[] };

export interface VideoListOptions {
  mode: ListMode;
  /** A getter, so the engine tracks the filters instead of copying them. */
  filters: () => BrowseFilters;
  /** Called when a load settles, with the page the user is now on. */
  onSettled?: (page: number) => void;
}

export interface VideoList {
  readonly state: ListState;
  /** Infinite mode: the highest page loaded. Paged: the page shown. */
  readonly page: number;
  loadMore(): void;
  /** Re-issues the last attempt, same page. */
  retry(): void;
}

/**
 * Ceiling on the one-request restore. `per_page` is uncapped server-side, which
 * is what makes restoring pages 1..N in a single request possible, and equally
 * what would make `?pg=5000&perpage=500` a request for 2.5M rows.
 */
const MAX_RESTORE_ITEMS = MAX_PERPAGE * 5;

interface Attempt {
  apiPage: number;
  apiSize: number;
  reachedPage: number;
}

export function createVideoList(options: VideoListOptions): VideoList {
  // Raw, because pages are appended by reassignment and each video carries a
  // description. A deep proxy over hundreds of those costs and buys nothing.
  let items = $state.raw<Video[]>([]);
  let total = $state(0);
  let page = $state(0);
  let loading = $state(true);
  let error = $state<Error | null>(null);

  let generation = 0;
  let inFlight = false;
  let attempt: Attempt | null = null;
  let loadedIdentity = "";

  /**
   * What the list is a list of. Infinite mode pins `page`, so the engine's own
   * `?pg=` write cannot restart it: loading page 2 changes the URL, which
   * changes the filters, which would restart the list and load page 1 again.
   * Paged mode wants that restart, so it keeps `page` in the identity.
   */
  const identity = $derived.by(() => {
    const current = options.filters();
    const pinned = options.mode === "paged" ? current.page : 1;
    return serialiseFilters({ ...current, page: pinned }).toString();
  });

  const exhausted = $derived(items.length >= total);

  const state = $derived.by<ListState>(() => {
    if (error) return { kind: "error", error, items };
    if (loading) {
      return items.length === 0
        ? { kind: "loading" }
        : { kind: "appending", items, total };
    }
    return { kind: "ready", items, total, exhausted };
  });

  /**
   * @param apiPage page to ask the API for
   * @param apiSize how many to ask for
   * @param reachedPage the page the user is on afterwards, which differs from
   *   `apiPage` on a restore covering pages 1..N
   */
  function load(apiPage: number, apiSize: number, reachedPage: number): void {
    if (inFlight) return;
    inFlight = true;
    attempt = { apiPage, apiSize, reachedPage };

    const startedAt = generation;
    loading = true;
    error = null;

    listVideos(options.filters(), { page: apiPage, perpage: apiSize })
      .then((result) => {
        // A response from before a reset belongs to a list that no longer
        // exists.
        if (startedAt !== generation) return;
        inFlight = false;

        items =
          options.mode === "infinite"
            ? items.concat(result.items)
            : result.items;
        total = result.total;
        page = reachedPage;
        loading = false;

        options.onSettled?.(reachedPage);
      })
      .catch((cause: unknown) => {
        if (startedAt !== generation) return;
        inFlight = false;
        error = cause instanceof Error ? cause : new Error(String(cause));
        loading = false;
      });
  }

  /** The first load, and the first load after every reset. */
  function begin(): void {
    const current = options.filters();
    const perpage = clampPerpage(current.perpage);

    if (options.mode === "paged") {
      load(current.page, perpage, current.page);
      return;
    }

    const maxPages = Math.max(1, Math.floor(MAX_RESTORE_ITEMS / perpage));
    const pages = Math.max(1, Math.min(current.page, maxPages));
    load(1, perpage * pages, pages);
  }

  function reset(): void {
    generation += 1;
    inFlight = false;
    items = [];
    total = 0;
    page = 0;
    error = null;
    begin();
  }

  $effect(() => {
    // `identity` is the only tracked read: the load path reads filters too, and
    // tracking those would restart the list on the engine's own `?pg=` write.
    const current = identity;

    untrack(() => {
      if (current === loadedIdentity) return;
      const restarting = loadedIdentity !== "";
      loadedIdentity = current;

      if (restarting) reset();
      else begin();
    });
  });

  return {
    get state() {
      return state;
    },
    get page() {
      return page;
    },

    loadMore() {
      if (options.mode !== "infinite") return;
      if (loading || error || exhausted) return;

      const perpage = clampPerpage(options.filters().perpage);
      load(page + 1, perpage, page + 1);
    },

    retry() {
      if (!attempt) return;
      load(attempt.apiPage, attempt.apiSize, attempt.reachedPage);
    },
  };
}
