// The bar is a view of the URL: every case here clicks a control and reads the
// query string back.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import BrowseBar from "../../src/components/browse/BrowseBar.svelte";
import ListControls from "../../src/components/browse/ListControls.svelte";
import { location } from "../../src/lib/router/location.svelte";
import { layout } from "../../src/lib/state/layout.svelte";
import { SEARCH_SORTS } from "../../src/lib/utils/browseFilters";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function params() {
  return new URLSearchParams(location.search);
}

function sortOptions() {
  return screen
    .getAllByRole("option")
    .map((option) => option.textContent?.trim() ?? "");
}

beforeEach(() => {
  setUrl("/");
  layout.isGrid = true;
});

describe("BrowseBar", () => {
  it("counts the library once the first page has landed", () => {
    const { rerender } = render(BrowseBar);
    expect(screen.getByText("Browse all")).toBeInTheDocument();

    void rerender({ total: 631 });
    expect(screen.getByText("Browse all 631")).toBeInTheDocument();
  });
});

describe("ListControls", () => {
  it("switches arrangement without touching the URL", async () => {
    render(BrowseBar);

    await userEvent.click(
      screen.getByRole("button", { name: "View results as list" }),
    );

    expect(layout.isGrid).toBe(false);
    expect(location.search).toBe("");
  });

  it("writes the sort through the select", async () => {
    render(BrowseBar);

    await userEvent.selectOptions(screen.getByLabelText("Sort:"), "oldest");

    expect(params().get("sort")).toBe("oldest");
  });

  it("offers date order only, since browsing has no query", () => {
    render(BrowseBar);

    expect(sortOptions()).toEqual(["Newest", "Oldest"]);
  });

  it("offers relevance to a surface that asks for it", () => {
    render(ListControls, { props: { sorts: SEARCH_SORTS } });

    expect(sortOptions()).toEqual(["Relevance", "Newest", "Oldest"]);
  });

  it("shows a sort the surface does not offer when the URL carries one", () => {
    // Or the select names an order the list is not in.
    setUrl("/?sort=relevance");
    render(BrowseBar);

    expect(sortOptions()).toEqual(["Newest", "Oldest", "Relevance"]);
    expect(screen.getByLabelText<HTMLSelectElement>("Sort:").value).toBe(
      "relevance",
    );
  });

  it("has no Per Page control on home", () => {
    render(BrowseBar);

    expect(screen.queryByLabelText(/Per Page/)).toBeNull();
  });
});
