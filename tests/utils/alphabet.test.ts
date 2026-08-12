import { describe, expect, it } from "vitest";
import {
  groupByInitial,
  initial,
  letterId,
} from "../../src/lib/utils/alphabet";

describe("initial", () => {
  it("takes the first letter, uppercased", () => {
    expect(initial("alice Cooper")).toBe("A");
  });

  it("folds diacritics onto the plain letter", () => {
    expect(initial("Jørgen Nielsen")).toBe("J");
    expect(initial("Ólafur Ísleifsson")).toBe("O");
  });

  it("puts anything outside A-Z under #", () => {
    expect(initial("3M Team")).toBe("#");
    expect(initial("")).toBe("#");
  });
});

describe("groupByInitial", () => {
  it("groups consecutive names sharing an initial", () => {
    const groups = groupByInitial(
      ["Alice", "Anna", "Bob", "42 Crew"],
      (name) => name,
    );

    expect(groups).toEqual([
      { letter: "A", items: ["Alice", "Anna"] },
      { letter: "B", items: ["Bob"] },
      { letter: "#", items: ["42 Crew"] },
    ]);
  });

  it("is empty for an empty list", () => {
    expect(groupByInitial([], (name: string) => name)).toEqual([]);
  });
});

describe("letterId", () => {
  it("names a section per letter, spelling # out", () => {
    expect(letterId("A")).toBe("presenters-A");
    expect(letterId("#")).toBe("presenters-other");
  });
});
