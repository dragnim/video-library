// The two containers, and the key that lets an infinite list grow without
// rewriting what is already on screen.

import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import ResultGrid from "../../src/components/results/ResultGrid.svelte";
import ResultList from "../../src/components/results/ResultList.svelte";
import { normaliseVideo } from "../../src/lib/api/normalise";

function video(id: string, title: string) {
  return normaliseVideo({ youtube_id: id, title });
}

const pageOne = [video("v1", "One"), video("v2", "Two"), video("v3", "Three")];
const pageTwo = [video("v4", "Four"), video("v5", "Five")];

describe("ResultGrid", () => {
  it("renders a card per video, in order", () => {
    const { container } = render(ResultGrid, { props: { items: pageOne } });

    const titles = [...container.querySelectorAll("h3")].map(
      (h) => h.textContent,
    );
    expect(titles).toEqual(["One", "Two", "Three"]);
  });

  it("leaves the cards already rendered in place when a page is appended", async () => {
    const { container, rerender } = render(ResultGrid, {
      props: { items: pageOne },
    });

    const before = [...container.querySelectorAll("article")];
    await rerender({ items: pageOne.concat(pageTwo) });
    const after = [...container.querySelectorAll("article")];

    expect(after.slice(0, 3)).toEqual(before);
    expect(after).toHaveLength(5);
  });

  it("moves a card rather than rewriting it when the order changes", async () => {
    // The assertion an index key fails. Appending alone does not catch it:
    // the existing items keep their positions, so their keys do not change.
    const { container, rerender } = render(ResultGrid, {
      props: { items: pageOne },
    });

    const first = container.querySelector("article");
    await rerender({ items: [...pageOne].reverse() });

    expect(first?.textContent).toContain("One");
    expect(container.querySelectorAll("article")[2]).toBe(first);
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(ResultGrid, { props: { items: [] } });

    expect(container.querySelector("div")).toBeNull();
  });
});

describe("ResultList", () => {
  it("renders a row per video", () => {
    const { container } = render(ResultList, { props: { items: pageOne } });

    const titles = [...container.querySelectorAll("h2")].map(
      (h) => h.textContent,
    );
    expect(titles).toEqual(["One", "Two", "Three"]);
  });

  it("renders nothing when there are no items", () => {
    const { container } = render(ResultList, { props: { items: [] } });

    expect(container.querySelector("div")).toBeNull();
  });
});
