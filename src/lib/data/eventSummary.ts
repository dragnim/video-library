// What the event list shows about an event, derived from its videos. The events
// endpoint carries only a name, a slug and a type.

import type { Video } from "../api/types";

export interface EventSummary {
  /** Slug, e.g. "dyalog-22". */
  eventSlug: string;
  talkCount: number;
  /** Earliest and latest talk. Null when no talk in the event has a date. */
  from: Date | null;
  to: Date | null;
  /** Most talks in this event first, ties by ascending id. */
  presenterIds: number[];
  presenterCount: number;
}

/**
 * Keyed by slug. A video with no `eventSlug` belongs to no event and is
 * dropped.
 */
export function summariseEvents(videos: Video[]): Map<string, EventSummary> {
  const talkCounts = new Map<string, number>();
  const dates = new Map<string, Date[]>();
  const presenterCounts = new Map<string, Map<number, number>>();

  for (const video of videos) {
    const slug = video.eventSlug;
    if (!slug) continue;

    talkCounts.set(slug, (talkCounts.get(slug) ?? 0) + 1);

    if (video.presentedAt !== null) {
      const seen = dates.get(slug);
      if (seen) seen.push(video.presentedAt);
      else dates.set(slug, [video.presentedAt]);
    }

    let counts = presenterCounts.get(slug);
    if (!counts) {
      counts = new Map();
      presenterCounts.set(slug, counts);
    }
    // A video crediting the same presenter twice would rank them twice over.
    for (const id of new Set(video.presenterIds)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const summaries = new Map<string, EventSummary>();

  for (const [slug, talkCount] of talkCounts) {
    const eventDates = dates.get(slug) ?? [];
    const times = eventDates.map((date) => date.getTime());
    const counts = presenterCounts.get(slug) ?? new Map<number, number>();

    // Ids, so the order holds however the roster resolves them.
    const presenterIds = [...counts.entries()]
      .sort(([idA, countA], [idB, countB]) => countB - countA || idA - idB)
      .map(([id]) => id);

    summaries.set(slug, {
      eventSlug: slug,
      talkCount,
      from: times.length === 0 ? null : new Date(Math.min(...times)),
      to: times.length === 0 ? null : new Date(Math.max(...times)),
      presenterIds,
      presenterCount: presenterIds.length,
    });
  }

  return summaries;
}
