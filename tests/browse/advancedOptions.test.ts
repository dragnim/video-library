// Three columns over one URL. The panel writes where the result can be shown,
// and a run of adjustments leaves one history entry behind it.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import AdvancedOptions from "../../src/components/browse/AdvancedOptions.svelte";
import type { RawEvent, RawPresenter } from "../../src/lib/api/normalise";
import { apiEvents, apiPresenters } from "../../src/lib/env";
import { location } from "../../src/lib/router/location.svelte";
import { loadRosters, rosters } from "../../src/lib/state/rosters.svelte";
import { server } from "../mocks/server";

const PRESENTERS: RawPresenter[] = [
  { id: 1, name: "John Smith" },
  { id: 2, name: "Jane Doe" },
];

/** The third has no slug, which is the one the event column drops. */
const EVENTS: Partial<RawEvent>[] = [
  { id: 1, url_slug: "dyalog-22", title: "Dyalog '22" },
  { id: 2, url_slug: "dyalog-23", title: "Dyalog '23" },
  { id: 3, title: "Nameless" },
];

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function params() {
  return new URLSearchParams(location.search);
}

beforeAll(async () => {
  server.use(
    http.get(apiPresenters, () => HttpResponse.json(PRESENTERS)),
    http.get(apiEvents, () => HttpResponse.json(EVENTS)),
  );
  loadRosters();
  await vi.waitFor(() => {
    expect(rosters.status).toBe("loaded");
  });
});

beforeEach(() => {
  setUrl("/");
});

describe("the event column", () => {
  it("writes the slug, not the name, and returns to page 1", async () => {
    setUrl("/?pg=3");
    render(AdvancedOptions);

    await userEvent.selectOptions(screen.getByLabelText("Event"), "dyalog-22");

    expect(params().get("event")).toBe("dyalog-22");
    expect(params().get("pg")).toBe("1");
  });

  it("reads Any with no event set, and clears back to it", async () => {
    setUrl("/?event=dyalog-22");
    render(AdvancedOptions);

    expect(screen.getByLabelText<HTMLSelectElement>("Event").value).toBe(
      "dyalog-22",
    );

    await userEvent.selectOptions(screen.getByLabelText("Event"), "");

    expect(params().has("event")).toBe(false);
  });

  it("drops an event whose slug is missing, which would read as a second Any", () => {
    render(AdvancedOptions);

    const events = screen.getByLabelText<HTMLSelectElement>("Event");

    expect([...events.options].map((option) => option.value)).toEqual([
      "",
      "dyalog-22",
      "dyalog-23",
    ]);
  });
});

describe("the three columns together", () => {
  it("each write the URL, and collapse to one history entry", async () => {
    render(AdvancedOptions);
    const before = window.history.length;

    await userEvent.selectOptions(screen.getByLabelText("From"), "2015");
    await userEvent.selectOptions(screen.getByLabelText("Event"), "dyalog-23");
    await userEvent.click(screen.getByLabelText("Presenter"));
    await userEvent.click(screen.getByRole("option", { name: "Jane Doe" }));

    expect(params().get("from")).toBe("2015-01-01");
    expect(params().get("event")).toBe("dyalog-23");
    expect(params().get("presenter_id")).toBe("2");
    expect(window.history.length).toBe(before);
  });

  it("lands on /search from a route that cannot show results", async () => {
    setUrl("/events?pg=2");
    render(AdvancedOptions);

    await userEvent.selectOptions(screen.getByLabelText("Event"), "dyalog-22");

    expect(location.pathname).toBe("/search");
    expect(params().get("event")).toBe("dyalog-22");
  });

  it("stays put on a route that can", async () => {
    render(AdvancedOptions);

    await userEvent.selectOptions(screen.getByLabelText("Event"), "dyalog-22");

    expect(location.pathname).toBe("/");
  });
});
