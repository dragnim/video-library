import { http, HttpResponse } from "msw";
import type {
  Video,
  VideosListResponse,
  RecommendedVideosResponse,
  EventApiResponse,
} from "./types";

const BASE_URL = "http://localhost:8081";

// Shared mock data for recommendation-style endpoints (GET /videos/recommended
// and GET /videos/:id/recommendations)
const mockRecommendedVideos: Video[] = [
  {
    youtube_id: "rec1",
    title: "Related Video 1",
    presenter: "John Smith",
    presenter_id: [1],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-12T00:00:00Z",
    published_at: "2022-09-16T10:30:00Z",
    description: "A related video about APL",
    thumbnail: "https://i.ytimg.com/vi/rec1/hqdefault.jpg",
  },
  {
    youtube_id: "rec2",
    title: "Related Video 2",
    presenter: "Jane Doe",
    presenter_id: [2],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-12T00:00:00Z",
    published_at: "2022-09-17T10:30:00Z",
    description: "Another related video",
    thumbnail: "https://i.ytimg.com/vi/rec2/hqdefault.jpg",
  },
  {
    youtube_id: "rec3",
    title: "Related Video 3",
    presenter: "John Smith & Jane Doe",
    presenter_id: [1, 2],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-11T00:00:00Z",
    published_at: "2023-09-18T10:30:00Z",
    description: "More related content",
    thumbnail: "https://i.ytimg.com/vi/rec3/hqdefault.jpg",
  },
];

// 15 mock videos with varied titles, dates, presenters, and events.
// `event` is the full name and `event_shortname` the slug, mirroring the live
// API; `presented_at` (talk date) is deliberately a few days before
// `published_at` so code that confuses the two shows up in tests.
const mockVideos: Video[] = [
  {
    youtube_id: "vid001",
    title: "Introduction to APL",
    presenter: "John Smith",
    presenter_id: [1],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-11T00:00:00Z",
    published_at: "2022-09-15T10:30:00Z",
    description: "Learn APL basics in this comprehensive introduction",
    thumbnail: "https://i.ytimg.com/vi/vid001/hqdefault.jpg",
  },
  {
    youtube_id: "vid002",
    title: "Advanced APL Techniques",
    presenter: "Jane Doe",
    presenter_id: [2],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-11T00:00:00Z",
    published_at: "2023-09-20T14:00:00Z",
    description: "Advanced topics for experienced APL programmers",
    thumbnail: "https://i.ytimg.com/vi/vid002/hqdefault.jpg",
  },
  {
    youtube_id: "vid003",
    title: "Dfns Workshop",
    presenter: "John Smith & Jane Doe",
    presenter_id: [1, 2],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-12T00:00:00Z",
    published_at: "2022-09-16T09:00:00Z",
    description: "Hands-on workshop covering dfns",
    thumbnail: "https://i.ytimg.com/vi/vid003/hqdefault.jpg",
  },
  {
    youtube_id: "vid004",
    title: "APL and Machine Learning",
    presenter: "Alice Cooper",
    presenter_id: [3],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-12T00:00:00Z",
    published_at: "2023-09-21T11:00:00Z",
    description: "Using APL for machine learning applications",
    thumbnail: "https://i.ytimg.com/vi/vid004/hqdefault.jpg",
  },
  {
    youtube_id: "vid005",
    title: "Array Thinking Fundamentals",
    presenter: "Bob Wilson",
    presenter_id: [4],
    event: "APL Quest",
    event_shortname: "apl-quest",
    presented_at: "2021-06-05T00:00:00Z",
    published_at: "2021-06-10T15:00:00Z",
    description: "Master the array paradigm",
    thumbnail: "https://i.ytimg.com/vi/vid005/hqdefault.jpg",
  },
  {
    youtube_id: "vid006",
    title: "Building Web Apps with APL",
    presenter: "Jane Doe",
    presenter_id: [2],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-13T00:00:00Z",
    published_at: "2022-09-17T10:00:00Z",
    description: "Create modern web applications using APL",
    thumbnail: "https://i.ytimg.com/vi/vid006/hqdefault.jpg",
  },
  {
    youtube_id: "vid007",
    title: "Performance Optimization",
    presenter: "John Smith",
    presenter_id: [1],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-13T00:00:00Z",
    published_at: "2023-09-22T09:30:00Z",
    description: "Tips and tricks for faster APL code",
    thumbnail: "https://i.ytimg.com/vi/vid007/hqdefault.jpg",
  },
  {
    youtube_id: "vid008",
    title: "Cryptography in APL",
    presenter: "Alice Cooper",
    presenter_id: [3],
    event: "APL Quest",
    event_shortname: "apl-quest",
    presented_at: "2021-06-06T00:00:00Z",
    published_at: "2021-06-11T14:00:00Z",
    description: "Implementing cryptographic algorithms",
    thumbnail: "https://i.ytimg.com/vi/vid008/hqdefault.jpg",
  },
  {
    youtube_id: "vid009",
    title: "Introduction to Dyalog",
    presenter: "Bob Wilson & Alice Cooper",
    presenter_id: [4, 3],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-11T00:00:00Z",
    published_at: "2022-09-14T08:00:00Z",
    description: "Getting started with Dyalog APL",
    thumbnail: "https://i.ytimg.com/vi/vid009/hqdefault.jpg",
  },
  {
    youtube_id: "vid010",
    title: "Tacit Programming Deep Dive",
    presenter: "Jane Doe",
    presenter_id: [2],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-11T00:00:00Z",
    published_at: "2023-09-19T16:00:00Z",
    description: "Point-free style programming in APL",
    thumbnail: "https://i.ytimg.com/vi/vid010/hqdefault.jpg",
  },
  {
    youtube_id: "vid011",
    title: "APL for Data Science",
    presenter: "John Smith",
    presenter_id: [1],
    event: "APL Quest",
    event_shortname: "apl-quest",
    presented_at: "2021-06-07T00:00:00Z",
    published_at: "2021-06-12T10:00:00Z",
    description: "Data analysis and visualization with APL",
    thumbnail: "https://i.ytimg.com/vi/vid011/hqdefault.jpg",
  },
  {
    youtube_id: "vid012",
    title: "Namespace and Classes",
    presenter: "Alice Cooper",
    presenter_id: [3],
    event: "Dyalog '22",
    event_shortname: "dyalog-22",
    presented_at: "2022-09-14T00:00:00Z",
    published_at: "2022-09-18T13:00:00Z",
    description: "Object-oriented features in Dyalog APL",
    thumbnail: "https://i.ytimg.com/vi/vid012/hqdefault.jpg",
  },
  {
    youtube_id: "vid013",
    title: "Error Handling Best Practices",
    presenter: "Bob Wilson",
    presenter_id: [4],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-14T00:00:00Z",
    published_at: "2023-09-23T11:30:00Z",
    description: "Robust error handling techniques",
    thumbnail: "https://i.ytimg.com/vi/vid013/hqdefault.jpg",
  },
  {
    youtube_id: "vid014",
    title: "APL Problem Solving Competition",
    presenter: "Jane Doe & Bob Wilson",
    presenter_id: [2, 4],
    event: "APL Quest",
    event_shortname: "apl-quest",
    presented_at: "2021-06-08T00:00:00Z",
    published_at: "2021-06-13T09:00:00Z",
    description: "Live problem solving session",
    thumbnail: "https://i.ytimg.com/vi/vid014/hqdefault.jpg",
  },
  {
    youtube_id: "vid015",
    title: "Future of APL",
    presenter: "John Smith & Alice Cooper",
    presenter_id: [1, 3],
    event: "Dyalog '23",
    event_shortname: "dyalog-23",
    presented_at: "2023-09-15T00:00:00Z",
    published_at: "2023-09-24T17:00:00Z",
    description: "Roadmap and upcoming features",
    thumbnail: "https://i.ytimg.com/vi/vid015/hqdefault.jpg",
  },
];

// Helper function to filter videos based on query parameters
function filterVideos(
  videos: Video[],
  params: {
    search?: string | null;
    from?: string | null;
    to?: string | null;
    presenter_id?: string | null;
    event?: string | null;
  },
): Video[] {
  let filtered = [...videos];

  // Filter by search query - supports:
  // 1. Comma-separated youtube_ids (e.g., "vid001,vid002" for featured videos)
  // 2. Title substring match (case-insensitive)
  if (params.search) {
    const searchTerms = params.search.split(",").map((s) => s.trim());
    // Check if search looks like youtube IDs (matches any video's youtube_id)
    const matchingByIds = videos.filter((v) =>
      searchTerms.includes(v.youtube_id),
    );
    if (matchingByIds.length > 0) {
      // Search by IDs - return videos matching any of the IDs
      filtered = matchingByIds;
    } else {
      // Fall back to title search (case-insensitive substring match)
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((v) =>
        v.title.toLowerCase().includes(searchLower),
      );
    }
  }

  // Filter by date range
  if (params.from) {
    const fromDate = new Date(params.from);
    filtered = filtered.filter((v) => new Date(v.published_at) >= fromDate);
  }
  if (params.to) {
    const toDate = new Date(params.to);
    // Set to end of day for inclusive comparison
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((v) => new Date(v.published_at) <= toDate);
  }

  // Filter by presenter_id (comma-separated ids; match if any selected id
  // appears in the video's presenter_id array)
  if (params.presenter_id) {
    const ids = params.presenter_id.split(",").map((id) => Number(id.trim()));
    filtered = filtered.filter((v) =>
      v.presenter_id.some((id) => ids.includes(id)),
    );
  }

  // Filter by event (the ?event= param carries the slug)
  if (params.event) {
    filtered = filtered.filter((v) => v.event_shortname === params.event);
  }

  return filtered;
}

// Helper function to paginate results
function paginateVideos(
  videos: Video[],
  page: number,
  perPage: number,
): { data: Video[]; from: number; to: number; lastPage: number } {
  const total = videos.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), lastPage);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);
  const data = videos.slice(from - 1, to);

  return { data, from, to, lastPage };
}

// Helper function to generate pagination links
function generatePaginationLinks(
  baseUrl: string,
  currentPage: number,
  lastPage: number,
): { url: string | null; label: string; active: boolean }[] {
  const links: { url: string | null; label: string; active: boolean }[] = [];

  // Previous link
  links.push({
    url: currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : null,
    label: "&laquo; Previous",
    active: false,
  });

  // Page number links
  for (let i = 1; i <= lastPage; i++) {
    links.push({
      url: `${baseUrl}?page=${i}`,
      label: String(i),
      active: i === currentPage,
    });
  }

  // Next link
  links.push({
    url: currentPage < lastPage ? `${baseUrl}?page=${currentPage + 1}` : null,
    label: "Next &raquo;",
    active: false,
  });

  return links;
}

export const handlers = [
  // GET /videos (search/list)
  http.get(`${BASE_URL}/videos`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const presenter_id = url.searchParams.get("presenter_id");
    const event =
      url.searchParams.get("event_shortname") || url.searchParams.get("event");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const perPage = parseInt(
      url.searchParams.get("per_page") ||
        url.searchParams.get("perpage") ||
        "10",
      10,
    );

    // Special case: empty results for specific search term
    if (search === "nonexistent") {
      return HttpResponse.json<VideosListResponse>({
        data: [],
        total: 0,
        from: 0,
        to: 0,
        current_page: 1,
        last_page: 1,
        per_page: perPage,
        links: [],
      });
    }

    // Filter videos based on query parameters
    const filtered = filterVideos(mockVideos, {
      search,
      from,
      to,
      presenter_id:
        presenter_id && presenter_id.length > 0 ? presenter_id : null,
      event,
    });

    // Paginate results
    const {
      data,
      from: fromIdx,
      to: toIdx,
      lastPage,
    } = paginateVideos(filtered, page, perPage);

    return HttpResponse.json<VideosListResponse>({
      data,
      total: filtered.length,
      from: fromIdx,
      to: toIdx,
      current_page: page,
      last_page: lastPage,
      per_page: perPage,
      links: generatePaginationLinks(`${BASE_URL}/videos`, page, lastPage),
    });
  }),

  // GET /videos/recommended?v={id} (recommended videos)
  http.get(`${BASE_URL}/videos/recommended`, ({ request }) => {
    const url = new URL(request.url);
    const videoId = url.searchParams.get("v");
    const nParam = url.searchParams.get("n");
    const n = nParam ? Number(nParam) : null;

    // 404 case - video not found
    if (videoId === "notfound") {
      return HttpResponse.json({ message: "Video not found" }, { status: 404 });
    }

    // Empty recommendations
    if (videoId === "norecs") {
      return HttpResponse.json<RecommendedVideosResponse>([]);
    }

    // Success case - recommended videos (returns plain array, not paginated)
    const result = mockRecommendedVideos.slice(
      0,
      n ?? mockRecommendedVideos.length,
    );

    return HttpResponse.json<RecommendedVideosResponse>(result);
  }),

  // GET /videos/{id}/recommendations?n={n} (per-video recommendations, used by
  // the Watch page's "Suggested Videos" section)
  http.get(`${BASE_URL}/videos/:id/recommendations`, ({ request }) => {
    const url = new URL(request.url);
    const nParam = url.searchParams.get("n");
    const n = nParam ? Number(nParam) : null;

    const result = mockRecommendedVideos.slice(
      0,
      n ?? mockRecommendedVideos.length,
    );

    return HttpResponse.json<RecommendedVideosResponse>(result);
  }),

  // GET /videos/{id} (single video)
  http.get(`${BASE_URL}/videos/:id`, ({ params }) => {
    const { id } = params as { id: string };

    // 404 case
    if (id === "notfound") {
      return HttpResponse.json({ message: "Video not found" }, { status: 404 });
    }

    // Look up video from mock data
    const video = mockVideos.find((v) => v.youtube_id === id);
    if (video) {
      return HttpResponse.json<Video>(video);
    }

    // Fallback for any other ID (for backwards compatibility with existing tests)
    return HttpResponse.json<Video>({
      youtube_id: id,
      title: "Introduction to APL",
      presenter: "John Smith & Jane Doe",
      presenter_id: [1, 2],
      event: "Dyalog '22",
      event_shortname: "dyalog-22",
      presented_at: "2022-09-11T00:00:00Z",
      published_at: "2022-09-15T10:30:00Z",
      description: "Learn APL basics in this comprehensive introduction",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }),

  // GET /events?has_videos=true
  // API returns { id, title, url_slug, type, start, end, has_videos }; the hook
  // maps to { id, fullname, shortname, type }. `start`/`end` are empty strings
  // on every live row, which is why event dates are derived from their videos.
  // Every mock event has videos in mockVideos, so has_videos does not filter here.
  http.get(`${BASE_URL}/events`, () => {
    return HttpResponse.json<EventApiResponse[]>([
      {
        id: 1,
        title: "Dyalog '22",
        url_slug: "dyalog-22",
        type: "Dyalog User Meeting",
        start: "",
        end: "",
        has_videos: true,
      },
      {
        id: 2,
        title: "Dyalog '23",
        url_slug: "dyalog-23",
        type: "Dyalog User Meeting",
        start: "",
        end: "",
        has_videos: true,
      },
      {
        id: 3,
        title: "APL Quest",
        url_slug: "apl-quest",
        type: "APL Quest",
        start: "",
        end: "",
        has_videos: true,
      },
    ]);
  }),

  // GET /presenters
  // API returns array of objects { id, name }
  http.get(`${BASE_URL}/presenters`, () => {
    return HttpResponse.json([
      { id: 1, name: "John Smith" },
      { id: 2, name: "Jane Doe" },
      { id: 3, name: "Alice Cooper" },
      { id: 4, name: "Bob Wilson" },
    ]);
  }),
];
