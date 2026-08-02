import { afterEach, describe, expect, it, vi } from "vitest";
import { checkThemeTokens } from "../../src/lib/themeTokens";

const BOUND = [
  "--e-global-color-primary",
  "--e-global-color-secondary",
  "--e-global-color-text",
  "--e-global-color-accent",
];

afterEach(() => {
  for (const token of BOUND) document.body.style.removeProperty(token);
  vi.restoreAllMocks();
});

describe("checkThemeTokens", () => {
  it("names the tokens the kit is not supplying", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.style.setProperty("--e-global-color-primary", "#34435e");
    document.body.style.setProperty("--e-global-color-secondary", "#ff6a13");
    document.body.style.setProperty("--e-global-color-text", "#232222");

    checkThemeTokens();

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("--e-global-color-accent");
    expect(warn.mock.calls[0][0]).not.toContain("--e-global-color-primary");
  });

  it("stays quiet when all four resolve", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const token of BOUND) document.body.style.setProperty(token, "#000");

    checkThemeTokens();

    expect(warn).not.toHaveBeenCalled();
  });
});
