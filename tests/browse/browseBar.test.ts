// The bar is a view of the URL: every case here clicks a control and reads the
// query string back.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import BrowseBar from "../../src/components/browse/BrowseBar.svelte";
import { location } from "../../src/lib/router/location.svelte";
import { layout } from "../../src/lib/state/layout.svelte";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function params() {
  return new URLSearchParams(location.search);
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

    await userEvent.selectOptions(screen.getByLabelText("Sort:"), "relevance");

    expect(params().get("sort")).toBe("relevance");
  });

  it("has no Per Page control on home", () => {
    render(BrowseBar);

    expect(screen.queryByLabelText(/Per Page/)).toBeNull();
  });
});
