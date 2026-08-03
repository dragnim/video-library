// Composes the router's scroll restore with the list's `?pg=` write, which have
// to happen in that order.

import { setFilters } from "../state/filters.svelte";
import { restoreScroll } from "./location.svelte";

/**
 * What the list engine reports when a load settles.
 *
 * The restore reads the offset stored under the current history key, and the
 * `?pg=` write mints a new one, so the restore goes first. dvl kept the same
 * ordering inside its fetching hook, where a comment was all that held it.
 *
 * `?pg=` is only written past the first page, so a fresh landing does not pick
 * up URL noise on first paint.
 */
export function onSettled(page: number): void {
  restoreScroll();

  if (page > 1) setFilters({ page }, { replace: true, keepScroll: true });
}
