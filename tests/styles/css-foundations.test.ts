// jsdom does not do layout, so the tiers, the tokens and the two load-bearing
// gradients are checked as text. These pin the values a tidy-up would silently
// change: the handoff numbers, the two breakpoints, and the reason each gradient
// is written the way it is.

// tsconfig.app.json lists no node types, and reading a file needs them.
/// <reference types="node" />

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const src = resolve(__dirname, "../../src");

/**
 * Comments off, since the sheet explains these rules in prose and prose is not
 * what is being asserted, and whitespace collapsed so an assertion survives
 * however Prettier wraps the declaration.
 */
function read(...path: string[]): string {
  return readFileSync(resolve(src, ...path), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ");
}

/** What a component's <style> block holds. */
function styles(...path: string[]): string {
  return /<style>([\s\S]*)<\/style>/.exec(read(...path))?.[1] ?? "";
}

const app = read("app.css");

const components = readdirSync(src, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith(".svelte"));

/** The declarations inside the first `@media` block matching `query`. */
function mediaBlock(source: string, query: string): string {
  const start = source.indexOf(query);
  if (start === -1) return "";

  let depth = 0;
  const from = source.indexOf("{", start);

  for (let i = from; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(from, i);
  }

  return "";
}

describe("design tokens", () => {
  it.each([
    ["page-bg", "#fbfaf9"],
    ["rule", "#e3e3e3"],
    ["divider-light", "#ecebe8"],
    ["chip", "#f1f0ee"],
    ["chip-border", "#e0dedb"],
    ["muted", "#6d7680"],
    ["card-border", "#dcdad6"],
    ["card-hover-border", "#c9b8ab"],
    ["card-hover-shadow", "0 2px 8px rgba\\(6, 26, 41, 0\\.12\\)"],
    ["skeleton", "#ecebe8"],
    ["scrim-strong", "rgba\\(6, 26, 41, 0\\.96\\)"],
    ["scrim-mid", "rgba\\(6, 26, 41, 0\\.72\\)"],
    ["scrim-soft", "rgba\\(6, 26, 41, 0\\.42\\)"],
    ["eyebrow", "#ffa877"],
    ["on-scrim", "#cfe0ec"],
    ["on-primary", "#ffffff"],
    ["radius", "3px"],
    ["grid-columns", "3"],
    ["grid-gap", "20px"],
  ])("--dyalog-video-library-%s is %s", (token, value) => {
    expect(app).toMatch(
      new RegExp(`--dyalog-video-library-${token}\\s*:\\s*${value}\\s*;`, "i"),
    );
  });
});

describe("the two breakpoints", () => {
  it("are the only two, across the sheet and every component", () => {
    const widths = new Set<string>();

    for (const source of [app, ...components.map((file) => styles(file))]) {
      for (const query of source.match(/@media[^{]+/g) ?? []) {
        widths.add(query.trim());
      }
    }

    expect([...widths].sort()).toEqual([
      "@media (max-width: 1000px)",
      "@media (max-width: 640px)",
    ]);
  });

  it("drop the grid to two columns at 1000px", () => {
    const block = mediaBlock(app, "@media (max-width: 1000px)");

    expect(block).toMatch(/--dyalog-video-library-grid-columns:\s*2/);
  });

  it("drop it to one column with a 14px gap at 640px", () => {
    const block = mediaBlock(app, "@media (max-width: 640px)");

    expect(block).toMatch(/--dyalog-video-library-grid-columns:\s*1/);
    expect(block).toMatch(/--dyalog-video-library-grid-gap:\s*14px/);
  });

  it("pad the page container at 640px, not the grid that sits inside it", () => {
    const block = mediaBlock(app, "@media (max-width: 640px)");

    expect(block).toContain(".video-library-x-padding");
    expect(block).toMatch(/padding-left:\s*14px/);
    expect(styles("components/results/ResultGrid.svelte")).not.toContain(
      "padding",
    );
  });
});

describe("the scrim over a thumbnail", () => {
  it("covers the whole thumbnail rather than its bottom edge", () => {
    // Many thumbnails are slides with burned-in titles, so this is legibility,
    // not decoration.
    const strip = styles("components/browse/FeaturedStrip.svelte");
    const scrim = strip.slice(strip.indexOf(".scrim"));

    expect(scrim).toMatch(/inset:\s*0/);
    expect(scrim).toMatch(/linear-gradient\( to top/);
    expect(scrim).toContain("var(--dyalog-video-library-scrim-strong)");
  });
});

describe("the skeleton fade", () => {
  it("is an opaque overlay, not a mask", () => {
    // As a mask only alpha counts, which makes the colour stops inert and runs
    // the fade the other way.
    const skeleton = styles("components/results/Skeleton.svelte");

    expect(skeleton).not.toContain("mask-image");
    expect(skeleton).toContain(".skeletons::after");
    expect(skeleton).toContain(
      "linear-gradient( to bottom, rgba(251, 250, 249, 0), rgba(251, 250, 249, 0.96) 65% )",
    );
  });
});

describe("touch targets at 640px", () => {
  it.each([
    ["chips", "components/browse/Chip.svelte"],
    ["the arrangement toggle", "components/browse/ListControls.svelte"],
    ["Load more", "components/results/InfiniteListFooter.svelte"],
  ])("gives %s a 44px minimum height", (_, file) => {
    const block = mediaBlock(styles(file), "@media (max-width: 640px)");

    expect(block).toMatch(/min-height:\s*44px/);
  });
});

describe("winning against Elementor", () => {
  it("puts nothing in a layer", () => {
    for (const file of components) {
      expect(styles(file)).not.toContain("@layer");
    }
    expect(app).not.toContain("@layer");
  });

  it("keeps every !important in the host-mutation block", () => {
    // The elements those rules touch are the theme's, not ours.
    for (const file of components) {
      expect(styles(file)).not.toContain("!important");
    }

    const hosts = app.slice(app.indexOf(".grid-container"));
    expect(app.match(/!important/g)).toHaveLength(3);
    expect(hosts.match(/!important/g)).toHaveLength(3);
  });
});
