import { describe, it, expect } from "vitest";
import {
  advancedSignature,
  hasAdvancedFilters,
  parseFilters,
  serialiseFilters,
  DEFAULT_FILTERS,
  MAX_PAGE,
  MAX_PERPAGE,
} from "../../src/lib/utils/browseFilters";

// browseFilters is the single home for the URL param vocabulary
// (q, pg, perpage, sort, from, to, presenter_id, event). Every consumer that
// reads or writes filters goes through here.

describe("parseFilters", () => {
  it("returns defaults for an empty search string", () => {
    expect(parseFilters("")).toEqual(DEFAULT_FILTERS);
  });

  it("defaults are 18 per page, newest first, page 1", () => {
    expect(DEFAULT_FILTERS).toEqual({
      q: "",
      sort: "newest",
      event: "",
      presenterIds: [],
      from: "",
      to: "",
      page: 1,
      perpage: 18,
    });
  });

  it("accepts a search string with or without the leading ?", () => {
    expect(parseFilters("?q=apl").q).toBe("apl");
    expect(parseFilters("q=apl").q).toBe("apl");
  });

  it("parses every supported param", () => {
    const filters = parseFilters(
      "?q=tacit&pg=3&perpage=40&sort=oldest&from=2020-01-01&to=2023-12-31&presenter_id=1,2&event=dyalog-22",
    );
    expect(filters).toEqual({
      q: "tacit",
      sort: "oldest",
      event: "dyalog-22",
      presenterIds: [1, 2],
      from: "2020-01-01",
      to: "2023-12-31",
      page: 3,
      perpage: 40,
    });
  });

  it("decodes percent-encoded queries", () => {
    expect(parseFilters("?q=APL+%26+Dyalog").q).toBe("APL & Dyalog");
  });

  describe("presenter_id", () => {
    it("splits a comma-separated list into numbers", () => {
      expect(parseFilters("?presenter_id=1,2,3").presenterIds).toEqual([
        1, 2, 3,
      ]);
    });

    it("returns an empty list when the param is absent or blank", () => {
      expect(parseFilters("").presenterIds).toEqual([]);
      expect(parseFilters("?presenter_id=").presenterIds).toEqual([]);
    });

    it("drops non-numeric entries rather than emitting NaN", () => {
      expect(parseFilters("?presenter_id=1,abc,3").presenterIds).toEqual([
        1, 3,
      ]);
    });
  });

  describe("pg", () => {
    it.each([
      ["?pg=3", 3],
      ["?pg=0", 1],
      ["?pg=-2", 1],
      ["?pg=abc", 1],
      ["?pg=", 1],
    ])("%s => page %i", (search, expected) => {
      expect(parseFilters(search).page).toBe(expected);
    });
  });

  describe("perpage", () => {
    it("reads perpage, the name the writer actually uses", () => {
      expect(parseFilters("?perpage=40").perpage).toBe(40);
    });

    it("falls back to the default for junk values", () => {
      expect(parseFilters("?perpage=abc").perpage).toBe(18);
      expect(parseFilters("?perpage=0").perpage).toBe(18);
    });
  });

  describe("sort", () => {
    it.each(["relevance", "newest", "oldest"])("passes %s through", (sort) => {
      expect(parseFilters(`?sort=${sort}`).sort).toBe(sort);
    });

    it("falls back to newest for a value the API does not accept", () => {
      // The API's sort accepts only relevance|newest|oldest
      expect(parseFilters("?sort=popular").sort).toBe("newest");
    });
  });

  it("ignores params outside the vocabulary", () => {
    expect(parseFilters("?v=abc123&utm_source=x")).toEqual(DEFAULT_FILTERS);
  });

  describe("request-size ceilings", () => {
    // per_page is uncapped server-side — which is what makes the one-request
    // restore possible, and equally what makes a stale or hand-edited URL a
    // request for millions of rows.
    it("clamps perpage rather than passing an absurd value to the API", () => {
      expect(parseFilters("?perpage=500").perpage).toBe(MAX_PERPAGE);
      expect(parseFilters("?perpage=999999").perpage).toBe(MAX_PERPAGE);
    });

    it("clamps pg, which the restore path multiplies by the page size", () => {
      expect(parseFilters("?pg=5000").page).toBe(MAX_PAGE);
    });

    it("leaves anything reachable through the UI alone", () => {
      // 631 videos at the smallest offered page size is nowhere near either cap
      expect(parseFilters("?perpage=60").perpage).toBe(60);
      expect(parseFilters("?pg=64").page).toBe(64);
    });
  });
});

describe("serialiseFilters", () => {
  it("always emits pg, sort and perpage", () => {
    // performSearch has always written these three unconditionally; browse
    // URLs are consistent with search URLs as a result.
    const params = serialiseFilters(DEFAULT_FILTERS);
    expect(params.get("pg")).toBe("1");
    expect(params.get("sort")).toBe("newest");
    expect(params.get("perpage")).toBe("18");
  });

  it("omits q, from, to and event when they are empty", () => {
    const params = serialiseFilters(DEFAULT_FILTERS);
    expect(params.has("q")).toBe(false);
    expect(params.has("from")).toBe(false);
    expect(params.has("to")).toBe(false);
    expect(params.has("event")).toBe(false);
  });

  it("emits a single comma-joined presenter_id, never repeated params", () => {
    const params = serialiseFilters({
      ...DEFAULT_FILTERS,
      presenterIds: [1, 2],
    });
    expect(params.getAll("presenter_id")).toEqual(["1,2"]);
  });

  it("omits presenter_id entirely when no presenters are selected", () => {
    expect(serialiseFilters(DEFAULT_FILTERS).has("presenter_id")).toBe(false);
  });

  it("fills unspecified fields from the defaults", () => {
    const params = serialiseFilters({ q: "apl" });
    expect(params.get("q")).toBe("apl");
    expect(params.get("sort")).toBe("newest");
    expect(params.get("perpage")).toBe("18");
    expect(params.get("pg")).toBe("1");
  });

  it("validates sort on the way out, not just on the way in", () => {
    // Otherwise a bad sort can be written but not read back, and the
    // round-trip below quietly stops holding for that case.
    const params = serialiseFilters({ ...DEFAULT_FILTERS, sort: "popular" });
    expect(params.get("sort")).toBe("newest");
  });

  it("clamps perpage on the way out too", () => {
    const params = serialiseFilters({ ...DEFAULT_FILTERS, perpage: 999999 });
    expect(params.get("perpage")).toBe(String(MAX_PERPAGE));
  });

  it("round-trips through parseFilters", () => {
    const filters = {
      q: "APL & Dyalog",
      sort: "oldest",
      event: "dyalog-23",
      presenterIds: [3, 4],
      from: "2019-01-01",
      to: "2024-12-31",
      page: 5,
      perpage: 40,
    };
    expect(parseFilters(serialiseFilters(filters).toString())).toEqual(filters);
  });
});

// The four fields the advanced-search panel owns: event, presenter_id, from, to.
const ADVANCED: Array<[string, Partial<typeof DEFAULT_FILTERS>]> = [
  ["event", { event: "dyalog-22" }],
  ["presenterIds", { presenterIds: [7] }],
  ["from", { from: "2019-01-01" }],
  ["to", { to: "2024-12-31" }],
];

describe("hasAdvancedFilters", () => {
  it("is false for the defaults", () => {
    expect(hasAdvancedFilters(DEFAULT_FILTERS)).toBe(false);
  });

  it.each(ADVANCED)("is true for %s alone", (_, field) => {
    expect(hasAdvancedFilters({ ...DEFAULT_FILTERS, ...field })).toBe(true);
  });

  it("ignores the fields the panel does not own", () => {
    expect(
      hasAdvancedFilters({
        ...DEFAULT_FILTERS,
        q: "apl",
        sort: "oldest",
        page: 4,
        perpage: 40,
      }),
    ).toBe(false);
  });
});

describe("advancedSignature", () => {
  it.each(ADVANCED)("changes for %s", (_, field) => {
    expect(advancedSignature({ ...DEFAULT_FILTERS, ...field })).not.toBe(
      advancedSignature(DEFAULT_FILTERS),
    );
  });

  it("is unchanged across q, sort, perpage and pg", () => {
    // A panel dismissed by the user stays dismissed when the sort changes.
    expect(
      advancedSignature({
        ...DEFAULT_FILTERS,
        q: "apl",
        sort: "oldest",
        page: 4,
        perpage: 40,
      }),
    ).toBe(advancedSignature(DEFAULT_FILTERS));
  });

  it("separates the four, so a value cannot slide between fields", () => {
    const from = advancedSignature({ ...DEFAULT_FILTERS, from: "x" });
    const to = advancedSignature({ ...DEFAULT_FILTERS, to: "x" });

    expect(from).not.toBe(to);
  });

  it("tells one presenter list from another", () => {
    const one = advancedSignature({ ...DEFAULT_FILTERS, presenterIds: [1, 2] });
    const two = advancedSignature({ ...DEFAULT_FILTERS, presenterIds: [1, 3] });

    expect(one).not.toBe(two);
  });
});
