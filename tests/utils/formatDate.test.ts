import { describe, expect, it } from "vitest";
import { formatDate } from "../../src/lib/utils/formatDate";

describe("formatDate", () => {
  it("abbreviates the month for the grid card", () => {
    // en-GB abbreviates September to "Sept"; other long months keep three.
    expect(formatDate(new Date("2022-09-11T00:00:00Z"), "short")).toBe(
      "Sept 2022",
    );
    expect(formatDate(new Date("2023-11-06T00:00:00Z"), "short")).toBe(
      "Nov 2023",
    );
  });

  it("spells the month out for the list row", () => {
    expect(formatDate(new Date("2022-09-11T00:00:00Z"), "long")).toBe(
      "September 2022",
    );
  });

  it("renders nothing for a video with no date", () => {
    // normaliseVideo yields null rather than an Invalid Date.
    expect(formatDate(null, "short")).toBe("");
  });

  it("does not follow the reader's locale", () => {
    const original = navigator.language;
    Object.defineProperty(navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });

    expect(formatDate(new Date("2022-09-11T00:00:00Z"), "long")).toBe(
      "September 2022",
    );

    Object.defineProperty(navigator, "language", {
      value: original,
      configurable: true,
    });
  });
});
