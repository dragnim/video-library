// A view over `presenter_id`: the type-ahead offers roster names, and every
// change is read back off the URL.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import PresenterPicker from "../../src/components/browse/PresenterPicker.svelte";
import type { RawPresenter } from "../../src/lib/api/normalise";
import { apiPresenters } from "../../src/lib/env";
import { location } from "../../src/lib/router/location.svelte";
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

function box() {
  return screen.getByLabelText("Presenter");
}

function offered() {
  return screen
    .getAllByRole("option")
    .map((option) => option.textContent?.trim() ?? "");
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
});

describe("the type-ahead", () => {
  it("offers eight at a time", async () => {
    render(PresenterPicker);

    await userEvent.click(box());

    expect(offered()).toHaveLength(8);
    expect(offered()[0]).toBe("John Smith");
  });

  it("filters on a trimmed, case-insensitive substring", async () => {
    render(PresenterPicker);

    await userEvent.type(box(), "  AN ");

    expect(offered()).toEqual([
      "Jane Doe",
      "Carol Danvers",
      "Dan Brown",
      "Hank Adams",
      "Ivan Petrov",
    ]);
  });

  it("stays closed until the box is used", () => {
    render(PresenterPicker);

    expect(screen.getByRole("listbox", { hidden: true })).toHaveAttribute(
      "hidden",
    );
    expect(box()).toHaveAttribute("aria-expanded", "false");
  });
});

describe("choosing", () => {
  it("keeps the presenters already chosen", async () => {
    setUrl("/?presenter_id=1");
    render(PresenterPicker);

    await userEvent.click(box());
    await userEvent.click(screen.getByRole("option", { name: "Jane Doe" }));

    expect(params().get("presenter_id")).toBe("1,2");
  });

  it("adds an id once, however many times it is chosen", async () => {
    setUrl("/?presenter_id=2");
    render(PresenterPicker);

    await userEvent.click(box());
    await userEvent.click(screen.getByRole("option", { name: "Jane Doe" }));

    expect(params().get("presenter_id")).toBe("2");
  });

  it("clears the query, so the next name starts from nothing", async () => {
    render(PresenterPicker);

    await userEvent.type(box(), "Jane");
    await userEvent.click(screen.getByRole("option", { name: "Jane Doe" }));

    expect(box()).toHaveValue("");
  });

  it("replaces the history entry, so Back leaves the panel", async () => {
    render(PresenterPicker);
    const before = window.history.length;

    await userEvent.click(box());
    await userEvent.click(screen.getByRole("option", { name: "Jane Doe" }));

    expect(window.history.length).toBe(before);
  });
});

describe("removing", () => {
  it("takes only the presenter whose token was clicked", async () => {
    setUrl("/?presenter_id=1,2,3");
    render(PresenterPicker);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove Jane Doe filter" }),
    );

    expect(params().get("presenter_id")).toBe("1,3");
  });

  it("stays possible for an id the roster does not carry", async () => {
    setUrl("/?presenter_id=999");
    render(PresenterPicker);

    await userEvent.click(
      screen.getByRole("button", { name: "Remove #999 filter" }),
    );

    expect(params().has("presenter_id")).toBe(false);
  });
});

describe("the keyboard", () => {
  it("chooses the active option with Enter", async () => {
    render(PresenterPicker);

    await userEvent.type(box(), "Jane");
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(params().get("presenter_id")).toBe("2");
  });

  it("moves the active option with the arrow keys", async () => {
    render(PresenterPicker);

    await userEvent.click(box());
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");

    expect(box()).toHaveAttribute("aria-activedescendant", "presenter-2");
  });

  it("stops at the ends of the list", async () => {
    render(PresenterPicker);

    await userEvent.type(box(), "Jane");
    await userEvent.keyboard("{ArrowUp}{ArrowUp}{ArrowDown}{ArrowDown}");

    expect(box()).toHaveAttribute("aria-activedescendant", "presenter-2");
  });

  it("closes on Escape, with focus still in the box", async () => {
    render(PresenterPicker);

    await userEvent.click(box());
    await userEvent.keyboard("{Escape}");

    expect(box()).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(box());
  });
});

describe("a click outside", () => {
  it("closes the list", async () => {
    render(PresenterPicker);

    await userEvent.click(box());
    expect(box()).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(document.body);

    expect(box()).toHaveAttribute("aria-expanded", "false");
  });
});

// The chips used to appear from nothing, which pushed the tab strip below them
// down the page the moment a presenter was chosen.
describe("the chip row's space", () => {
  it("is there before anything is chosen", () => {
    const { container } = render(PresenterPicker);

    expect(container.querySelector(".chosen-slot")).not.toBeNull();
    expect(container.querySelector(".chosen")).toBeNull();
  });

  // The list is anchored to the input until a chip is there and to the whole
  // picker after, so it never covers the presenter just added and never hangs a
  // row low with nothing chosen. The class is what switches it.
  it("says whether anything is chosen, for the list to sit clear of", () => {
    const { container } = render(PresenterPicker);

    expect(container.querySelector(".picker")).not.toHaveClass("chosen-any");
  });
});
