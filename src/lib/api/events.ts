import { apiEvents } from "../env";
import { buildUrl, fetchJson } from "./client";
import { normaliseEvents, type RawEvent } from "./normalise";
import type { DyalogEvent } from "./types";

/** The roster of events, those with videos: the rest filter to nothing. */
export async function listEvents(): Promise<DyalogEvent[]> {
  const url = buildUrl(apiEvents, { has_videos: true });

  return normaliseEvents(await fetchJson<Partial<RawEvent>[]>(url));
}
