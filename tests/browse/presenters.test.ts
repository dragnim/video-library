// The presenter list: the roster in alphabetical order, each row linking into a
// filtered videos view.

import { beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import Presenters from "../../src/components/browse/Presenters.svelte";
import { loadRosters, rosters } from "../../src/lib/state/rosters.svelte";

// The rows are the roster joined with the summaries, so both have to be in.
beforeAll(async () => {
  loadRosters();
  await vi.waitFor(() => {
    expect(rosters.status).toBe("loaded");
  });
});

describe("the presenter list", () => {
  it("lists the roster alphabetically", async () => {
    render(Presenters);

    const headings = await screen.findAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual([
      "Alice Cooper",
      "Bob Wilson",
      "Jane Doe",
      "John Smith",
    ]);
  });

  it("links a presenter to their videos", async () => {
    render(Presenters);

    const link = await screen.findByRole("link", { name: "John Smith" });

    expect(link).toHaveAttribute(
      "href",
      "/search?pg=1&presenter_id=1&sort=newest&perpage=18",
    );
  });

  it("counts the presenter's talks and the events they gave them at", async () => {
    render(Presenters);

    const row = (await screen.findByRole("heading", { name: "John Smith" }))
      .parentElement;

    expect(row).toHaveTextContent("5 videos");
    expect(row).toHaveTextContent("Dyalog '22, Dyalog '23, APL Quest");
  });
});

describe("the alphabet bar", () => {
  it("groups the roster under its initials", async () => {
    render(Presenters);

    const letters = await screen.findAllByRole("heading", { level: 2 });

    expect(letters.map((letter) => letter.textContent?.trim())).toEqual([
      "A",
      "B",
      "J",
    ]);
  });

  it("links a letter the roster has to its section", async () => {
    render(Presenters);

    const link = await screen.findByRole("link", { name: "J" });

    expect(link).toHaveAttribute("href", "#presenters-J");
  });

  it("offers no link for a letter no presenter starts with", async () => {
    render(Presenters);

    await screen.findByRole("link", { name: "J" });

    expect(screen.queryByRole("link", { name: "Q" })).toBeNull();
  });
});
