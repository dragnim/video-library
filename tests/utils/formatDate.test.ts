import { describe, expect, it } from "vitest";
import { formatDate, formatDateRange } from "../../src/lib/utils/formatDate";

describe("formatDateRange", () => {
  it("shows one label for an event inside a single month", () => {
    expect(
      formatDateRange(
        new Date("2022-10-09T00:00:00Z"),
        new Date("2022-10-12T00:00:00Z"),
        "short",
      ),
    ).toBe("Oct 2022");
  });

  it("shows both ends for an event spanning two months", () => {
    expect(
      formatDateRange(
        new Date("2022-10-30T00:00:00Z"),
        new Date("2022-11-02T00:00:00Z"),
        "short",
      ),
    ).toBe("Oct 2022 to Nov 2022");
  });

  it("shows whichever end it has when only one is dated", () => {
    expect(
      formatDateRange(new Date("2022-10-09T00:00:00Z"), null, "short"),
    ).toBe("Oct 2022");
    expect(
      formatDateRange(null, new Date("2022-10-09T00:00:00Z"), "short"),
    ).toBe("Oct 2022");
  });

  it("renders nothing for an event with no dated talk", () => {
    expect(formatDateRange(null, null, "short")).toBe("");
  });
});

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
