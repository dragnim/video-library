// Maps app filter names to the API's param names.

import { apiVideos } from "../env";
import type { BrowseFilters } from "../utils/browseFilters";
import { buildUrl, fetchJson } from "./client";
import {
  normaliseVideo,
  normaliseVideoPage,
  type RawVideo,
  type RawVideoPage,
} from "./normalise";
import type { Page, Video } from "./types";

/**
 * The page to request, independent of `filters.page` and `filters.perpage`: the
 * list engine's restore asks for `perpage × N` in one request.
 */
export interface PageRequest {
  page: number;
  perpage: number;
}

/**
 * One page of videos matching `filters`. `total` counts every match, so
 * `?event=dyalog-22` reports that event's size.
 */
export async function listVideos(
  filters: BrowseFilters,
  { page, perpage }: PageRequest,
): Promise<Page<Video>> {
  const url = buildUrl(apiVideos, {
    search: filters.q,
    page,
    per_page: perpage,
    sort: filters.sort,
    presenter_id: filters.presenterIds,
    from: filters.from,
    to: filters.to,
    // An empty event filters every video out (Dyalog/Jarvis issue 115), and
    // buildUrl omits it. `filters.event` is the slug.
    event: filters.event,
  });

  return normaliseVideoPage(await fetchJson<Partial<RawVideoPage>>(url));
}

/** One video by its YouTube id. */
export async function getVideo(youtubeId: string): Promise<Video> {
  const url = buildUrl(`${apiVideos}/${encodeURIComponent(youtubeId)}`);

  return normaliseVideo(await fetchJson<Partial<RawVideo>>(url));
}
