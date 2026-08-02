// TEMPORARY — the *wire* shapes the MSW handlers emit, i.e. what the DCMS API
// literally returns. Carried from `dvl/tests/types/api.ts`.
//
// This is fixture support, NOT dvl2's type layer. It exists only so `handlers.ts`
// compiles in 0.4 without a toolchain issue settling dvl2's API shape by import.
//
// **Deleted in issue 1.3**, which declares the raw response shapes next to
// `normalise.ts` and retypes the handlers against them. See 0.4 → Decisions taken.
// Do not import this from `src/`.

export interface Video {
  youtube_id: string;
  title: string;
  presenter: string;
  presenter_id: number[];
  /** Full event name, e.g. "Dyalog '22" */
  event: string;
  /** Event slug, e.g. "dyalog-22" — what ?event= carries */
  event_shortname: string;
  /** ISO 8601 talk date. Use this for year ranges and season lines. */
  presented_at: string;
  /** ISO 8601 publication date (e.g., "2022-09-15T10:30:00Z") */
  published_at: string;
  description?: string;
  thumbnail?: string;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface VideosListResponse {
  data: Video[];
  total: number;
  from: number;
  to: number;
  current_page: number;
  last_page: number;
  per_page: number;
  links: PaginationLink[];
}

/** Raw shape returned by GET /events?has_videos=true */
export interface EventApiResponse {
  id: number;
  title: string;
  url_slug: string;
  type: string;
  /** Empty string on every live row today; dates come from the videos instead */
  start: string;
  end: string;
  has_videos: boolean;
}

export type RecommendedVideosResponse = Video[];

/** Raw shape returned by GET /presenters. The handler emits it untyped. */
export interface Presenter {
  id: number;
  name: string;
}
