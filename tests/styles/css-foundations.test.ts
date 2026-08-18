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
    ["rule", "#e6e6e6"],
    ["divider-light", "#ecebe8"],
    ["chip", "#f1f0ee"],
    ["chip-border", "#e0dedb"],
    ["muted", "#6d7680"],
    ["text-strong", "#232222"],
    ["card-border", "#e6e6e6"],
    ["card-shadow", "0 0 25px rgba\\(0, 0, 0, 0\\.05\\)"],
    ["card-hover-shadow", "0 0 30px rgba\\(0, 0, 0, 0\\.18\\)"],
    ["panel-shadow", "0 2px 8px rgba\\(6, 26, 41, 0\\.12\\)"],
    ["card-transition", "box-shadow 300ms ease"],
    ["skeleton", "#ecebe8"],
    ["scrim-mid", "rgba\\(6, 26, 41, 0\\.72\\)"],
    ["on-scrim-strong", "#ffffff"],
    ["thumb-bg", "#111111"],
    ["surface", "#ffffff"],
    ["on-primary", "#ffffff"],
    ["radius", "5px"],
    ["control-height", "32px"],
    ["grid-columns", "3"],
    ["grid-gap", "20px"],
    // Named, not bound to the kit: inheriting it from the body is what let the
    // whole library change typeface without anything in the app changing.
    ["font-display", '"Klavika", sans-serif'],
    ["font-text", '"IBM Plex Sans", sans-serif'],
    ["size-xs", "0\\.75rem"],
    ["size-sm", "0\\.9375rem"],
    ["size-base", "1rem"],
    ["size-md", "1\\.125rem"],
    ["size-lg", "1\\.4rem"],
    ["size-xl", "1\\.5rem"],
    ["size-2xl", "1\\.875rem"],
    // Klavika has 300/400/500/700 and no 600, so a 600 silently renders as Bold.
    ["weight-regular", "400"],
    ["weight-medium", "500"],
    ["weight-bold", "700"],
    ["heading-line-height", "1\\.3"],
    ["heading-tracking", "-0\\.2px"],
    ["meta-line-height", "1\\.8"],
  ])("--dyalog-video-library-%s is %s", (token, value) => {
    expect(app).toMatch(
      new RegExp(`--dyalog-video-library-${token}\\s*:\\s*${value}\\s*;`, "i"),
    );
  });
});

describe("the screen-reader utility", () => {
  it("is declared in the sheet, with the two parts that are easy to lose", () => {
    // The mount id, or a kit rule on inputs outranks it. See the kit note below.
    expect(app).toContain("#dyalog-video-library .sr-only {");
    expect(app).toMatch(/\.sr-only \{[^}]*clip-path: inset\(50%\)/);
    // A 1px box wraps the text to one character per line without it.
    expect(app).toMatch(/\.sr-only \{[^}]*white-space: nowrap/);
  });

  // A second copy cannot be seen to have drifted: only a screen reader hears it.
  it("is declared nowhere else", () => {
    const owners = components.filter((file) =>
      /\.sr-only\s*[,{]/.test(styles(file)),
    );

    expect(owners).toEqual([]);
  });
});

describe("the two breakpoints", () => {
  it("are the only two, across the sheet and every component", () => {
    const widths = new Set<string>();

    for (const source of [app, ...components.map((file) => styles(file))]) {
      for (const query of source.match(/@media[^{]+/g) ?? []) {
        // Width queries only. A preference query such as
        // prefers-reduced-motion is not a breakpoint.
        if (query.includes("width")) widths.add(query.trim());
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

describe("the skeleton fade", () => {
  it("is an opaque overlay, not a mask", () => {
    // As a mask only alpha counts, which makes the colour stops inert and runs
    // the fade the other way.
    const skeleton = styles("components/results/Skeleton.svelte");

    expect(skeleton).not.toContain("mask-image");
    expect(skeleton).toContain(".skeletons::after");
    expect(skeleton).toContain(
      "linear-gradient( to bottom, color-mix(in srgb, var(--dyalog-video-library-page-bg) 0%, transparent), color-mix(in srgb, var(--dyalog-video-library-page-bg) 96%, transparent) 65% )",
    );
  });
});

describe("touch targets at 640px", () => {
  it.each([
    ["the arrangement toggle", "components/browse/ListControls.svelte"],
    ["the year selects", "components/browse/YearRangePicker.svelte"],
    ["the presenter type-ahead", "components/browse/PresenterPicker.svelte"],
    ["the event select", "components/browse/AdvancedOptions.svelte"],
    ["Load more", "components/results/InfiniteListFooter.svelte"],
  ])("gives %s a 44px minimum height", (_, file) => {
    const block = mediaBlock(styles(file), "@media (max-width: 640px)");

    expect(block).toMatch(/min-height:\s*44px/);
  });
});

describe("buttons against the kit", () => {
  // Elementor's kit styles `button:hover` and `button:focus` at 0,2,1, which
  // outranks a scoped class at 0,2,0, so anything styling a button raises its
  // rule to the mount id. Removing the id looks like tidying and turns every
  // button in the app accent purple on hover.
  it.each([
    ["components/browse/ListControls.svelte", ".icon"],
    ["components/browse/Videos.svelte", ".clear"],
    ["components/browse/YearRangePicker.svelte", ".all"],
    ["components/browse/PresenterPicker.svelte", ".chip"],
    ["components/results/InfiniteListFooter.svelte", ".load-more"],
    ["components/chrome/SearchBar.svelte", "button"],
    ["components/chrome/TermsFooter.svelte", ".toggle"],
  ])("%s raises %s to the mount id", (file, selector) => {
    expect(styles(file)).toContain(
      `:global(#dyalog-video-library) ${selector}`,
    );
  });
});

describe("headings against the kit", () => {
  // `.elementor-kit-6 h3` styles colour, size, weight, line-height and letter
  // spacing at 0,1,1, which ties with a component's scoped `h3` and wins on
  // source order, because WordPress enqueues the kit after us. app.css reverts
  // the kit at the id's 1,0,0, so a component's own heading rule has to sit
  // above that to be seen at all. Dropping the id looks like tidying and hands
  // every heading in the app back to whatever the kit says today.
  it.each([
    ["components/results/VideoCard.svelte", "h3"],
    ["components/results/VideoRow.svelte", "h2"],
    ["components/browse/Events.svelte", "h3"],
    ["components/results/PresenterRow.svelte", "h3"],
    ["components/browse/AdvancedOptions.svelte", "h3"],
    ["routes/Watch.svelte", "h1"],
    // A heading styled through a class rather than its tag needs the id just
    // as much: `.heading` is 0,1,0 and the revert above is 1,0,0, so without it
    // the wordmark renders at the browser's h1 size. SearchBar's is a
    // `<svelte:element>`, which is why it does not read as a heading in the
    // markup.
    ["components/chrome/SearchBar.svelte", ".heading"],
    ["components/browse/Events.svelte", ".type"],
    ["components/browse/FeaturedStrip.svelte", ".hero-card h3"],
    ["components/browse/FeaturedStrip.svelte", ".event h3"],
    ["components/browse/Presenters.svelte", ".letter"],
    ["routes/Watch.svelte", ".suggested"],
  ])("%s raises %s to the mount id", (file, selector) => {
    expect(styles(file)).toContain(
      `:global(#dyalog-video-library) ${selector}`,
    );
  });

  it("reverts the kit's heading typography in the sheet", () => {
    // Two blocks now match that selector — the display face, and this one.
    const block =
      /:where\(h1, h2, h3, h4, h5, h6\) \{([^}]*font-size: revert[^}]*)\}/.exec(
        app,
      );

    expect(block).not.toBeNull();
    for (const property of ["font-size", "font-weight", "word-spacing"]) {
      expect(block?.[1]).toContain(`${property}: revert`);
    }

    // These two the app has an opinion about, so they are set rather than
    // reverted. Every heading gets them; a component restates them to disagree.
    expect(block?.[1]).toContain(
      "line-height: var(--dyalog-video-library-heading-line-height)",
    );
    expect(block?.[1]).toContain(
      "letter-spacing: var(--dyalog-video-library-heading-tracking)",
    );
  });
});

describe("type comes from the scale", () => {
  // Sixteen ad-hoc sizes had accumulated one component at a time, two of them
  // in `em` so they resized with their container. A literal here is a step
  // outside the scale, and a font-weight literal is how five rules came to ask
  // for a 600 that Klavika does not have.
  it.each(components)("%s sizes type from tokens", (file) => {
    const declarations =
      styles(file).match(/font-(?:size|weight)\s*:\s*[^;]+;/g) ?? [];

    for (const declaration of declarations) {
      expect(declaration).toMatch(/:\s*var\(--dyalog-video-library-/);
    }
  });
});

describe("rules span their container", () => {
  // The browser's default hr margin is `0.5em auto`, and an auto cross-axis
  // margin cancels flex stretch — so an <hr> in a column flex container has no
  // width at all. Two of the app's four separators sit in one.
  it("forces the inline margins off every rule", () => {
    expect(app).toMatch(/:where\(hr\) \{\s*margin-inline: 0;/);
  });
});

describe("the two faces", () => {
  // Klavika announces, IBM Plex Sans is read. The pairing is expressed once —
  // the mount names the text face and the reset names the display face for
  // headings — so a component naming a family is a third face by accident.
  it.each(components)("%s names no typeface of its own", (file) => {
    expect(styles(file)).not.toMatch(/font-family\s*:/);
  });

  it("pairs the faces in the sheet and nowhere else", () => {
    expect(app).toMatch(
      /#dyalog-video-library \{[^}]*font-family: var\(--dyalog-video-library-font-text\)/,
    );
    expect(app).toMatch(
      /:where\(h1, h2, h3, h4, h5, h6\) \{\s*font-family: var\(--dyalog-video-library-font-display\)/,
    );
  });
});

describe("colours come from tokens", () => {
  // A literal in a component is a colour the palette cannot reach, and the
  // handoff white was in eight components before it was one token.
  it.each(components)("%s names no colour of its own", (file) => {
    const source = styles(file);

    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/\b(?:rgba?|hsla?)\(/i);
    expect(source).not.toMatch(/:\s*(?:white|black)\b/i);
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
