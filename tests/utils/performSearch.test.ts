import { describe, expect, it, vi } from "vitest";
import { performSearch } from "../../src/lib/utils/performSearch";
import { DEFAULT_FILTERS } from "../../src/lib/utils/browseFilters";

// Ported from dvl with one change: it took react-router's history, it now
// takes navigate.

/**
 * performSearch's "element" call path: something whose `target` is the empty
 * string, standing in for the live search form. filterQuery iterates it and
 * reads `.name` / `.value` off each member, exactly as it does over a real
 * HTMLFormElement.
 */
function formLike(fields: Record<string, string>) {
  const members = Object.entries(fields).map(([name, value]) => ({
    name,
    value,
  }));
  return Object.assign(members, { target: "" as const });
}

function navigatedTo(navigate: ReturnType<typeof vi.fn>) {
  const [url] = navigate.mock.calls[0] as [string];
  const [pathname, search] = url.split("?");
  return { pathname, params: new URLSearchParams(search ?? "") };
}

describe("performSearch", () => {
  it("defaults to /search so existing callers are unaffected", () => {
    const navigate = vi.fn();
    performSearch(navigate)(formLike({ q: "apl" }), [], "", "", "newest");

    expect(navigatedTo(navigate).pathname).toBe("/search");
  });

  it("navigates to the target pathname when given one", () => {
    const navigate = vi.fn();
    performSearch(navigate, "/presenters")(
      formLike({ q: "apl" }),
      [],
      "",
      "",
      "newest",
    );

    expect(navigatedTo(navigate).pathname).toBe("/presenters");
  });

  it("keeps the query on the browse route rather than jumping to /search", () => {
    const navigate = vi.fn();
    performSearch(navigate, "/")(
      formLike({ q: "tacit" }),
      [],
      "",
      "",
      "oldest",
    );

    const { pathname, params } = navigatedTo(navigate);
    expect(pathname).toBe("/");
    expect(params.get("q")).toBe("tacit");
    expect(params.get("sort")).toBe("oldest");
  });

  describe("the sort a submit does not name", () => {
    it("is relevance for a free text query", () => {
      const navigate = vi.fn();
      performSearch(navigate)(formLike({ q: "apl" }));

      expect(navigatedTo(navigate).params.get("sort")).toBe("relevance");
    });

    it("is date order with no query", () => {
      const navigate = vi.fn();
      performSearch(navigate)(formLike({ "ao-event": "dyalog-22" }));

      expect(navigatedTo(navigate).params.get("sort")).toBe("newest");
    });
  });

  it("resets to page 1", () => {
    const navigate = vi.fn();
    performSearch(navigate)(formLike({ q: "apl" }), [], "", "", "newest");

    expect(navigatedTo(navigate).params.get("pg")).toBe("1");
  });

  it("writes presenters as one comma-separated presenter_id param", () => {
    const navigate = vi.fn();
    performSearch(navigate)(
      formLike({ q: "" }),
      [
        { id: 1, name: "John Smith" },
        { id: 2, name: "Jane Doe" },
      ],
      "",
      "",
      "newest",
    );

    expect(navigatedTo(navigate).params.getAll("presenter_id")).toEqual([
      "1,2",
    ]);
  });

  it("omits presenter_id when nothing is selected", () => {
    const navigate = vi.fn();
    performSearch(navigate)(formLike({ q: "apl" }), [], "", "", "newest");

    expect(navigatedTo(navigate).params.has("presenter_id")).toBe(false);
  });

  it("carries the date range through", () => {
    const navigate = vi.fn();
    performSearch(navigate)(
      formLike({ q: "" }),
      [],
      "2020-01-01",
      "2023-12-31",
      "newest",
    );

    const { params } = navigatedTo(navigate);
    expect(params.get("from")).toBe("2020-01-01");
    expect(params.get("to")).toBe("2023-12-31");
  });

  it("omits an empty query rather than writing q=", () => {
    const navigate = vi.fn();
    performSearch(navigate)(formLike({ q: "" }), [], "", "", "newest");

    expect(navigatedTo(navigate).params.has("q")).toBe(false);
  });

  it("encodes special characters", () => {
    const navigate = vi.fn();
    performSearch(navigate)(
      formLike({ q: "APL & Dyalog" }),
      [],
      "",
      "",
      "newest",
    );

    const [url] = navigate.mock.calls[0] as [string];
    expect(url).toContain("%26");
    expect(navigatedTo(navigate).params.get("q")).toBe("APL & Dyalog");
  });

  it('treats the "Any" event as no event filter', () => {
    const navigate = vi.fn();
    performSearch(navigate)(
      formLike({ q: "apl", "ao-event": "Any" }),
      [],
      "",
      "",
      "newest",
    );

    expect(navigatedTo(navigate).params.has("event")).toBe(false);
  });

  it("passes a real event through", () => {
    const navigate = vi.fn();
    performSearch(navigate)(
      formLike({ q: "apl", "ao-event": "dyalog-22" }),
      [],
      "",
      "",
      "newest",
    );

    expect(navigatedTo(navigate).params.get("event")).toBe("dyalog-22");
  });

  it("navigates to a relative URL built without window.location", () => {
    // The old implementation built `new URL(`${protocol}${hostname}/search`)`,
    // missing the `//`, purely to get a URLSearchParams. It happened to work;
    // it should not be there at all.
    const navigate = vi.fn();
    performSearch(navigate)(formLike({ q: "apl" }), [], "", "", "newest");

    const [url] = navigate.mock.calls[0] as [string];
    expect(url.startsWith("/search?")).toBe(true);
    expect(url).not.toContain("http");
    expect(url).not.toContain("localhost");
  });

  it("falls back to the shared default page size, not a second hardcoded 20", () => {
    const navigate = vi.fn();
    performSearch(navigate)(formLike({ q: "apl" }), [], "", "", "newest");

    expect(navigatedTo(navigate).params.get("perpage")).toBe(
      String(DEFAULT_FILTERS.perpage),
    );
  });

  it("honours the panel's Per Page selection when there is one", () => {
    const navigate = vi.fn();
    performSearch(navigate)(
      formLike({ q: "apl", "ao-pagination": "40" }),
      [],
      "",
      "",
      "newest",
    );

    expect(navigatedTo(navigate).params.get("perpage")).toBe("40");
  });

  it("joins a repeated field rather than silently dropping it", () => {
    // filterQuery returns an array when a form has two fields of one name.
    const navigate = vi.fn();
    const members = [
      { name: "q", value: "apl" },
      { name: "q", value: "dyalog" },
    ];
    performSearch(navigate)(
      Object.assign(members, { target: "" as const }),
      [],
      "",
      "",
      "newest",
    );

    expect(navigatedTo(navigate).params.get("q")).toBe("apl,dyalog");
  });

  it("does not emit q=null or event=null when the form lacks those fields", () => {
    // filterQuery returns null for a missing field, and the old code compared
    // it against "" — so a missing field became the literal string "null".
    const navigate = vi.fn();
    performSearch(navigate)(formLike({}), [], "", "", "newest");

    const { params } = navigatedTo(navigate);
    expect(params.has("q")).toBe(false);
    expect(params.has("event")).toBe(false);
  });
});
