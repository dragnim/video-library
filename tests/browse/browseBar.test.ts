// The bar is a view of the URL: every case here clicks a control and reads the
// query string back.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import BrowseBar from "../../src/components/browse/BrowseBar.svelte";
import type { RawPresenter } from "../../src/lib/api/normalise";
import { apiPresenters } from "../../src/lib/env";
import { location } from "../../src/lib/router/location.svelte";
import { layout } from "../../src/lib/state/layout.svelte";
import { loadRosters, rosters } from "../../src/lib/state/rosters.svelte";
import { server } from "../mocks/server";

/** Twelve, so the type-ahead has more than the eight it offers. */
const PRESENTERS: RawPresenter[] = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Jane Doe" },
  { id: 3, name: "Alice Cooper" },
  { id: 4, name: "Bob Wilson" },
  { id: 5, name: "Carol Danvers" },
  { id: 6, name: "Dan Brown" },
  { id: 7, name: "Erik Olsen" },
  { id: 8, name: "Fiona Clark" },
  { id: 9, name: "Grace Hopper" },
  { id: 10, name: "Hank Adams" },
  { id: 11, name: "Ivan Petrov" },
  { id: 12, name: "Judy Bell" },
];

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function params() {
  return new URLSearchParams(location.search);
}

function menuItems() {
  return screen
    .getAllByRole("listitem")
    .map((item) => item.textContent?.trim() ?? "");
}

beforeAll(async () => {
  server.use(http.get(apiPresenters, () => HttpResponse.json(PRESENTERS)));
  loadRosters();
  await vi.waitFor(() => {
    expect(rosters.status).toBe("loaded");
  });
});

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

  it("writes the sort and returns to page 1", async () => {
    setUrl("/?pg=4&sort=oldest");
    render(BrowseBar);

    await userEvent.click(screen.getByRole("button", { name: "Newest" }));

    expect(params().get("sort")).toBe("newest");
    expect(params().get("pg")).toBe("1");
  });

  it("writes an event's slug, not its name", async () => {
    setUrl("/?pg=3");
    render(BrowseBar);

    await userEvent.click(screen.getByRole("button", { name: "Event" }));
    await userEvent.click(screen.getByRole("button", { name: "Dyalog '22" }));

    expect(params().get("event")).toBe("dyalog-22");
    expect(params().get("pg")).toBe("1");
  });

  it("adds a presenter without dropping the ones already chosen", async () => {
    setUrl("/?presenter_id=1");
    render(BrowseBar);

    await userEvent.click(screen.getByRole("button", { name: "Presenter" }));
    await userEvent.click(screen.getByRole("button", { name: "Jane Doe" }));

    expect(params().get("presenter_id")).toBe("1,2");
  });

  it("removes only the presenter whose chip was clicked", async () => {
    setUrl("/?presenter_id=1,2,3");
    render(BrowseBar);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove Jane Doe filter" }),
    );

    expect(params().get("presenter_id")).toBe("1,3");
  });

  it("keeps a chip removable for an id the roster does not carry", async () => {
    setUrl("/?presenter_id=999");
    render(BrowseBar);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove #999 filter" }),
    );

    expect(params().get("presenter_id")).toBeNull();
  });

  it("offers eight presenters at a time", async () => {
    render(BrowseBar);

    await userEvent.click(screen.getByRole("button", { name: "Presenter" }));

    expect(menuItems()).toHaveLength(8);
    expect(menuItems()[0]).toBe("John Smith");
  });

  it("filters the roster on a trimmed, case-insensitive substring", async () => {
    render(BrowseBar);

    await userEvent.click(screen.getByRole("button", { name: "Presenter" }));
    await userEvent.type(screen.getByLabelText("Filter presenters"), "  AN ");

    expect(menuItems()).toEqual([
      "Jane Doe",
      "Carol Danvers",
      "Dan Brown",
      "Hank Adams",
      "Ivan Petrov",
    ]);
  });

  it("opens one menu at a time", async () => {
    render(BrowseBar);
    const event = screen.getByRole("button", { name: "Event" });

    await userEvent.click(event);
    expect(event).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Presenter" }));

    expect(event).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByLabelText("Filter presenters")).toBeInTheDocument();
  });

  it("closes on Escape, with focus back on the chip", async () => {
    render(BrowseBar);
    const event = screen.getByRole("button", { name: "Event" });

    await userEvent.click(event);
    await userEvent.keyboard("{Escape}");

    expect(event).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(event);
  });

  it("closes on a click outside it", async () => {
    render(BrowseBar);
    const event = screen.getByRole("button", { name: "Event" });

    await userEvent.click(event);
    await userEvent.click(screen.getByText("Browse all"));

    expect(event).toHaveAttribute("aria-expanded", "false");
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
