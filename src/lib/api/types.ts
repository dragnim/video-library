// The app's view of the API. Raw responses are converted in normalise.ts.

/** A presenter in the roster, from GET /presenters. */
export interface Presenter {
  id: number;
  name: string;
}

export interface Video {
  /** Identity everywhere, including `/watch?v=`. */
  youtubeId: string;
  title: string;
  /** Names come from the roster. */
  presenterIds: number[];
  /** Full event name, e.g. "Dyalog '22". */
  event: string;
  /** Event slug, e.g. "dyalog-22". What `?event=` carries. */
  eventSlug: string;
  description: string;
  thumbnail: string;
  /** When the talk was given. */
  presentedAt: Date | null;
  /** When the video went up. */
  publishedAt: Date | null;
}

/** Named off `Event`, which the DOM owns. */
export interface DyalogEvent {
  id: number;
  /** Slug, e.g. "dyalog-22". */
  shortname: string;
  fullname: string;
  /** Event kind, e.g. "Dyalog User Meeting". */
  type: string;
}

/** One page of a list. `total` is how many matched, not how many are here. */
export interface Page<T> {
  items: T[];
  total: number;
}
