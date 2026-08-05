// What the presenter list shows about a presenter, derived from their videos.
// The presenters endpoint carries only an id and a name.

import type { Video } from "../api/types";

export interface PresenterSummary {
  presenterId: number;
  talkCount: number;
  /** Earliest and latest talk. Null when no talk of theirs has a date. */
  from: Date | null;
  to: Date | null;
  /** Most talks at that event first, ties by ascending slug. */
  eventSlugs: string[];
  eventCount: number;
}

/**
 * Keyed by presenter id. A video crediting nobody is dropped.
 */
export function summarisePresenters(
  videos: Video[],
): Map<number, PresenterSummary> {
  const talkCounts = new Map<number, number>();
  const dates = new Map<number, Date[]>();
  const eventCounts = new Map<number, Map<string, number>>();

  for (const video of videos) {
    // A video crediting the same presenter twice would count the talk twice.
    for (const id of new Set(video.presenterIds)) {
      talkCounts.set(id, (talkCounts.get(id) ?? 0) + 1);

      if (video.presentedAt !== null) {
        const seen = dates.get(id);
        if (seen) seen.push(video.presentedAt);
        else dates.set(id, [video.presentedAt]);
      }

      if (!video.eventSlug) continue;

      let counts = eventCounts.get(id);
      if (!counts) {
        counts = new Map();
        eventCounts.set(id, counts);
      }
      counts.set(video.eventSlug, (counts.get(video.eventSlug) ?? 0) + 1);
    }
  }

  const summaries = new Map<number, PresenterSummary>();

  for (const [id, talkCount] of talkCounts) {
    const presenterDates = dates.get(id) ?? [];
    const times = presenterDates.map((date) => date.getTime());
    const counts = eventCounts.get(id) ?? new Map<string, number>();

    // Slugs, so the order holds however the roster names them.
    const eventSlugs = [...counts.entries()]
      .sort(
        ([slugA, countA], [slugB, countB]) =>
          countB - countA || slugA.localeCompare(slugB),
      )
      .map(([slug]) => slug);

    summaries.set(id, {
      presenterId: id,
      talkCount,
      from: times.length === 0 ? null : new Date(Math.min(...times)),
      to: times.length === 0 ? null : new Date(Math.max(...times)),
      eventSlugs,
      eventCount: eventSlugs.length,
    });
  }

  return summaries;
}
