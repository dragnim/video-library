// The filters are the URL, so every case reads one and writes the other.

import { describe, expect, it } from "vitest";
import { location } from "../../src/lib/router/location.svelte";
import { filters, setFilters } from "../../src/lib/state/filters.svelte";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function currentParams() {
  return new URLSearchParams(location.search);
}

describe("filters.current", () => {
  it("reads the URL", () => {
    setUrl("/?q=apl&sort=oldest&presenter_id=1,3&pg=2");

    expect(filters.current).toMatchObject({
      q: "apl",
      sort: "oldest",
      presenterIds: [1, 3],
      page: 2,
    });
  });

  it("follows a navigation", () => {
    setUrl("/?q=apl");
    expect(filters.current.q).toBe("apl");

    setUrl("/?q=tacit");
    expect(filters.current.q).toBe("tacit");
  });
});

describe("setFilters", () => {
  it("keeps the filters the patch does not mention", () => {
    setUrl("/?q=apl&event=dyalog-22&sort=oldest");

    setFilters({ sort: "newest" });

    const params = currentParams();
    expect(params.get("q")).toBe("apl");
    expect(params.get("event")).toBe("dyalog-22");
    expect(params.get("sort")).toBe("newest");
  });

  it("returns to page 1 on a filter change", () => {
    setUrl("/?pg=4&sort=oldest");

    setFilters({ sort: "newest" });

    expect(currentParams().get("pg")).toBe("1");
  });

  it("honours a page the patch names, which is how the list records its own", () => {
    setUrl("/?sort=newest");

    setFilters({ page: 3 });

    expect(currentParams().get("pg")).toBe("3");
  });

  it("writes to the route the user is on", () => {
    setUrl("/watch?v=vid001");

    setFilters({ q: "apl" });

    expect(location.pathname).toBe("/watch");
  });

  it("writes to another route when given one", () => {
    setUrl("/");

    setFilters({ q: "apl" }, { pathname: "/search" });

    expect(location.pathname).toBe("/search");
    expect(currentParams().get("q")).toBe("apl");
  });

  it("pushes by default, so Back returns to the previous filters", () => {
    setUrl("/");
    const before = window.history.length;

    setFilters({ q: "apl" });

    expect(window.history.length).toBe(before + 1);
    expect(location.action).toBe("PUSH");
  });

  it("replaces when asked, so Back skips the write", () => {
    setUrl("/");
    const before = window.history.length;

    setFilters({ page: 2 }, { replace: true });

    expect(window.history.length).toBe(before);
    expect(location.action).toBe("REPLACE");
  });
});
