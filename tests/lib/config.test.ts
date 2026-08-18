import { afterEach, describe, expect, it, vi } from "vitest";
import { parseConfig } from "../../src/lib/config";

describe("parseConfig", () => {
  it("returns null when nothing is configured", () => {
    expect(parseConfig(undefined)).toBeNull();
  });

  it("returns null without a hero, so the front page falls back", () => {
    expect(parseConfig({ featured: { secondaryIds: ["a"] } })).toBeNull();
  });

  it("keeps the siblings a partial featured block leaves out", () => {
    expect(parseConfig({ featured: { hero: "aaa" } })).toEqual({
      hero: "aaa",
      heroEyebrow: "",
      secondaryIds: [],
    });
  });

  it("reads a full block", () => {
    expect(
      parseConfig({
        featured: {
          hero: "aaa",
          heroEyebrow: "Editor's pick",
          secondaryIds: ["bbb"],
        },
      }),
    ).toEqual({
      hero: "aaa",
      heroEyebrow: "Editor's pick",
      secondaryIds: ["bbb"],
    });
  });

  it("warns on an unknown key instead of ignoring a typo", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    parseConfig({ featured: { hero: "aaa", heroEyebow: "typo" } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("heroEyebow"));
  });

  it("warns and keeps one when given more secondaries than there are slots", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = parseConfig({
      featured: { hero: "aaa", secondaryIds: ["bbb", "ccc"] },
    });
    expect(config?.secondaryIds).toEqual(["bbb"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("secondaryIds"));
  });

  it("says why a configured eventSlug stopped mattering", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config = parseConfig({
      featured: { hero: "aaa", eventSlug: "dyalog-23" },
    });

    // Not an unknown key: the operator is told it is retired, and the rest of
    // the block still parses.
    expect(config?.hero).toBe("aaa");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("no longer used"),
    );
  });
});

// The global is read once at module evaluation, so each case reimports.
describe("featuredConfig", () => {
  afterEach(() => {
    delete window.DYALOG_VIDEO_CONFIG;
  });

  async function load() {
    vi.resetModules();
    return (await import("../../src/lib/config")).featuredConfig;
  }

  it("is null when the global is absent", async () => {
    expect(await load()).toBeNull();
  });

  it("parses whatever config.js assigned", async () => {
    window.DYALOG_VIDEO_CONFIG = { featured: { hero: "aaa" } };
    expect(await load()).toMatchObject({ hero: "aaa" });
  });
});
