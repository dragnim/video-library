// Whether the advanced-search panel is showing.
//
// Not a URL param: browseFilters.ts's vocabulary is exhaustive, so an `adv=1`
// would join serialiseFilters, and from there the list engine's identity, and
// opening a panel would restart the list.

import { location } from "../router/location.svelte";
import {
  advancedSignature,
  hasAdvancedFilters,
  rerunPathFor,
  type BrowseFilters,
} from "../utils/browseFilters";
import { filters, setFilters } from "./filters.svelte";

/**
 * What the user last said about the panel, and the advanced filters they said it
 * about. A choice holds only while those filters do: the next change to them is
 * a new question, so arriving filters reopen a panel the user had closed.
 */
let choice = $state<{ about: string; open: boolean } | null>(null);

const signature = $derived(advancedSignature(filters.current));

function isOpen(): boolean {
  if (choice !== null && choice.about === signature) return choice.open;

  // No answer for these filters yet. Advanced filters are showing, so show the
  // controls that produced them.
  return hasAdvancedFilters(filters.current);
}

export const searchPanel = {
  get open(): boolean {
    return isOpen();
  },

  /** The toggle button, and the panel re-affirming itself after its own write. */
  set open(next: boolean) {
    choice = { about: signature, open: next };
  },

  toggle(): void {
    choice = { about: signature, open: !isOpen() };
  },
};

/**
 * A write from one of the panel's own controls.
 *
 * It lands where the result can be shown, replaces the history entry so a run of
 * adjustments collapses to one, and re-affirms the panel: a write that cleared
 * the last advanced filter would otherwise close the panel under the cursor.
 *
 * `setFilters` navigates synchronously, so by the time `open` is set the
 * signature is already the new one and the choice attaches to the right question.
 */
export function applyFilters(patch: Partial<BrowseFilters>): void {
  setFilters(patch, {
    replace: true,
    pathname: rerunPathFor(location.pathname),
  });
  searchPanel.open = true;
}
