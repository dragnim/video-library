// What the card and the row share about presenter and event credits.

import { rosters } from "../../lib/state/rosters.svelte";
import { serialiseFilters } from "../../lib/utils/browseFilters";

export interface PresenterLabel {
  id: number;
  /** The roster's name, or `#id` for one it does not carry. */
  label: string;
}

/**
 * Empty while the roster is loading, so a card leaves the line out rather than
 * showing an id the roster is about to name.
 */
export function presenterLabels(ids: number[]): PresenterLabel[] {
  if (rosters.status === "loading") return [];

  return ids.map((id) => ({
    id,
    label: rosters.presenterName(id) ?? `#${id}`,
  }));
}

/**
 * Every credit is a link to that presenter's videos. dvl carried the current
 * sort and page size across, reading `per_page` where the param is `perpage`,
 * so it always carried 20.
 */
export function presenterHref(id: number): string {
  return `/search?${serialiseFilters({ presenterIds: [id] }).toString()}`;
}

export function eventHref(shortname: string): string {
  return `/search?${serialiseFilters({ event: shortname }).toString()}`;
}

/** dvl joins a pair with an ampersand and three or more with commas. */
export function separator(index: number, count: number): string {
  if (index === count - 1) return "";

  return count === 2 ? " & " : ", ";
}
