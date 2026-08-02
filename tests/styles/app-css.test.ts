// jsdom cannot do layout, so the sheet is checked as text. These are the two
// ways dvl's theme bindings actually broke: a reference with no fallback, and
// a reference to a hash token Elementor had since renamed.

// tsconfig.app.json lists no node types, and reading a file needs them. Vite's
// `?raw` import would avoid that, but Vitest stubs every CSS request to "".
/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "../../src/app.css"), "utf8");

// Comments off: the sheet explains both of these rules in prose, and prose is
// not what the assertions are about.
const css = source.replace(/\/\*[\s\S]*?\*\//g, "");

/** The four tokens Elementor names semantically. Everything else is a hash id. */
const BINDABLE = ["primary", "secondary", "text", "accent"];

describe("app.css", () => {
  it("gives every Elementor token reference a fallback", () => {
    const references = css.match(/var\(\s*--e-global-color-[^)]*\)/g) ?? [];

    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      expect(reference).toContain(",");
    }
  });

  it("references no hash-named Elementor token", () => {
    const names = css.match(/--e-global-color-([\w-]+)/g) ?? [];
    const referenced = names.map((name) =>
      name.replace("--e-global-color-", ""),
    );

    expect([...new Set(referenced)].sort()).toEqual([...BINDABLE].sort());
  });

  it("puts nothing in a layer", () => {
    expect(css).not.toContain("@layer");
  });
});
