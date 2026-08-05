// The strip navigates, so it has to announce navigation. ARIA tabs would tell a
// screen reader user a panel is about to swap.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Tabs from "../../src/components/browse/Tabs.svelte";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

describe("the browse strip", () => {
  it("is navigation, and offers no tabs", () => {
    setUrl("/");
    render(Tabs);

    expect(
      screen.getByRole("navigation", { name: "Browse" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("offers each destination as a link", () => {
    setUrl("/");
    render(Tabs);

    expect(screen.getByRole("link", { name: "Videos" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute(
      "href",
      "/events",
    );
  });

  it("marks the route the user is on, and only that one", () => {
    setUrl("/events");
    render(Tabs);

    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    // Absent, not "false": aria-current has no false value, so the string would
    // announce this one as current too.
    expect(screen.getByRole("link", { name: "Videos" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  // A search renders the same view with filters, not a place of its own.
  it("marks Videos on a search", () => {
    setUrl("/search?q=apl");
    render(Tabs);

    expect(screen.getByRole("link", { name: "Videos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks nothing on a route that is not a destination", () => {
    setUrl("/watch?v=vid001");
    render(Tabs);

    for (const label of ["Videos", "Events"]) {
      expect(screen.getByRole("link", { name: label })).not.toHaveAttribute(
        "aria-current",
      );
    }
  });
});
