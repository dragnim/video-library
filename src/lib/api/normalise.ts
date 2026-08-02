// Raw API rows in, total app types out. Any field can go missing, so the
// normalisers take Partials of the Raw* shapes.

import { assetsPrefix } from "../env";
import type { DyalogEvent, Page, Presenter, Video } from "./types";

export interface RawVideo {
  youtube_id: string;
  title: string;
  /** Display string. Unused: names come from the roster. */
  presenter: string;
  presenter_id: number[];
  event: string;
  event_shortname: string;
  /** Talk date. */
  presented_at: string;
  /** Upload date. */
  published_at: string;
  description: string;
  thumbnail: string;
}

export interface RawVideoPage {
  data: Partial<RawVideo>[];
  total: number;
}

export interface RawEvent {
  id: number;
  title: string;
  url_slug: string;
  type: string;
  /** Empty on every live row today. */
  start: string;
  end: string;
  has_videos: boolean;
}

export interface RawPresenter {
  id: number;
  name: string;
}

const placeholderThumbnail = `${assetsPrefix}/placeholder.png`;

/** The API sends "2025-07-01 00:00:00". Read as UTC so the day can't shift. */
function toDate(value: string | undefined): Date | null {
  if (!value) return null;

  const parts =
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/.exec(value);
  const date = parts
    ? new Date(
        Date.UTC(
          Number(parts[1]),
          Number(parts[2]) - 1,
          Number(parts[3]),
          Number(parts[4] ?? 0),
          Number(parts[5] ?? 0),
          Number(parts[6] ?? 0),
        ),
      )
    : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function normaliseVideo(raw: Partial<RawVideo>): Video {
  return {
    youtubeId: raw.youtube_id ?? "",
    title: raw.title ?? "",
    presenterIds: raw.presenter_id ?? [],
    event: raw.event ?? "",
    eventSlug: raw.event_shortname ?? "",
    description: raw.description ?? "",
    thumbnail: raw.thumbnail ?? placeholderThumbnail,
    presentedAt: toDate(raw.presented_at),
    publishedAt: toDate(raw.published_at),
  };
}

/** Rows with no id are dropped; they would link nowhere. `total` is the server's. */
export function normaliseVideoPage(raw: Partial<RawVideoPage>): Page<Video> {
  const items = (raw.data ?? [])
    .filter((video) => video.youtube_id)
    .map(normaliseVideo);

  return { items, total: raw.total ?? items.length };
}

/** Rows with no id are dropped; nothing can filter or link without one. */
export function normaliseEvents(raw: Partial<RawEvent>[]): DyalogEvent[] {
  return raw.flatMap((event) =>
    event.id === undefined
      ? []
      : [
          {
            id: event.id,
            shortname: event.url_slug ?? "",
            fullname: event.title ?? "",
            type: event.type ?? "",
          },
        ],
  );
}

/** Rows with no id are dropped; the roster exists to resolve ids. */
export function normalisePresenters(raw: Partial<RawPresenter>[]): Presenter[] {
  return raw.flatMap((presenter) =>
    presenter.id === undefined
      ? []
      : [{ id: presenter.id, name: presenter.name ?? "" }],
  );
}
