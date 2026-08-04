// Whether the advanced-search panel is showing.
//
// Not a URL param: browseFilters.ts's vocabulary is exhaustive, so an `adv=1`
// would join serialiseFilters, and from there the list engine's identity, and
// opening a panel would restart the list.

import { advancedSignature, hasAdvancedFilters } from "../utils/browseFilters";
import { filters } from "./filters.svelte";

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
