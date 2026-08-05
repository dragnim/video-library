// Every event's and every presenter's summary, from one request. Loaded when an
// entity list first mounts rather than at init: the payload carries every
// video's description, and only those pages need it.

import { listVideos } from "../api/videos";
import { DEFAULT_FILTERS } from "../utils/browseFilters";
import { summariseEvents, type EventSummary } from "./eventSummary";
import { summarisePresenters, type PresenterSummary } from "./presenterSummary";

export type SummaryStatus = "loading" | "loaded" | "failed";

/**
 * `per_page` is uncapped server-side.
 */
const ALL_VIDEOS_PERPAGE = 2000;

let status = $state<SummaryStatus>("loading");
let eventSummaries = $state.raw<Map<string, EventSummary>>(new Map());
let presenterSummaries = $state.raw<Map<number, PresenterSummary>>(new Map());

export const summaries = {
  get status(): SummaryStatus {
    return status;
  },

  /** `undefined` for an event with no videos, which has nothing to summarise. */
  event(shortname: string): EventSummary | undefined {
    return eventSummaries.get(shortname);
  },

  /** `undefined` for a presenter with no videos. */
  presenter(id: number): PresenterSummary | undefined {
    return presenterSummaries.get(id);
  },
};

let started = false;

/**
 * Called when an entity list mounts. Loads once per page load, so visiting both
 * lists costs one request.
 */
export function loadSummaries(): void {
  if (started) return;
  started = true;

  void load();
}

async function load(): Promise<void> {
  try {
    const page = await listVideos(DEFAULT_FILTERS, {
      page: 1,
      perpage: ALL_VIDEOS_PERPAGE,
    });

    if (page.total > page.items.length) {
      console.warn(
        `Summaries cover ${page.items.length} of ${page.total} videos; raise ALL_VIDEOS_PERPAGE.`,
      );
    }

    eventSummaries = summariseEvents(page.items);
    presenterSummaries = summarisePresenters(page.items);
    status = "loaded";
  } catch (error) {
    console.warn(`Summaries failed to load: ${String(error)}`);
    status = "failed";
  }
}
