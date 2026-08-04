// Every event's summary, from one request. Loaded when the event list first
// mounts rather than at init: the payload carries every video's description,
// and only this page needs it.

import { listVideos } from "../api/videos";
import { DEFAULT_FILTERS } from "../utils/browseFilters";
import { summariseEvents, type EventSummary } from "./eventSummary";

export type SummaryStatus = "loading" | "loaded" | "failed";

/**
 * `per_page` is uncapped server-side.
 */
const ALL_VIDEOS_PERPAGE = 2000;

let status = $state<SummaryStatus>("loading");
let summaries = $state.raw<Map<string, EventSummary>>(new Map());

export const eventSummaries = {
  get status(): SummaryStatus {
    return status;
  },

  /** `undefined` for an event with no videos, which has nothing to summarise. */
  get(shortname: string): EventSummary | undefined {
    return summaries.get(shortname);
  },
};

let started = false;

/** Called when the event list mounts. Loads once per page load. */
export function loadEventSummaries(): void {
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
        `Event summaries cover ${page.items.length} of ${page.total} videos; raise ALL_VIDEOS_PERPAGE.`,
      );
    }

    summaries = summariseEvents(page.items);
    status = "loaded";
  } catch (error) {
    console.warn(`Event summaries failed to load: ${String(error)}`);
    status = "failed";
  }
}
