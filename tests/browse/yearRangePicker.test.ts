// Whole years in the URL as dates, and two lists that cannot be crossed.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import YearRangePicker from "../../src/components/browse/YearRangePicker.svelte";
import { location } from "../../src/lib/router/location.svelte";

const THIS_YEAR = new Date().getFullYear();

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function params() {
  return new URLSearchParams(location.search);
}

function select(name: "From" | "To") {
  return screen.getByLabelText<HTMLSelectElement>(name);
}

function years(name: "From" | "To") {
  return [...select(name).options].map((option) => option.value);
}

function last(values: string[]) {
  return values[values.length - 1];
}

beforeEach(() => {
  setUrl("/");
});

describe("YearRangePicker", () => {
  it("writes whole years as the API's dates, and returns to page 1", async () => {
    setUrl("/?pg=4");
    render(YearRangePicker);

    await userEvent.selectOptions(select("From"), "2015");
    await userEvent.selectOptions(select("To"), "2019");

    expect(params().get("from")).toBe("2015-01-01");
    expect(params().get("to")).toBe("2019-12-31");
    expect(params().get("pg")).toBe("1");
  });

  it("keeps the year already chosen when the other end changes", async () => {
    setUrl("/?from=2015-01-01");
    render(YearRangePicker);

    await userEvent.selectOptions(select("To"), "2019");

    expect(params().get("from")).toBe("2015-01-01");
  });

  it("reads a mid-year date as its year, since the picker is whole-year", () => {
    setUrl("/?from=2015-06-01");
    render(YearRangePicker);

    expect(select("From").value).toBe("2015");
  });

  it("reads as Any with neither end set", () => {
    render(YearRangePicker);

    expect(select("From").value).toBe("");
    expect(select("To").value).toBe("");
  });

  it("replaces the history entry, so Back leaves the panel", async () => {
    render(YearRangePicker);
    const before = window.history.length;

    await userEvent.selectOptions(select("From"), "2015");

    expect(window.history.length).toBe(before);
  });

  describe("the two lists", () => {
    it("run the library's span when neither end is set", () => {
      render(YearRangePicker);

      expect(years("From")).toEqual([
        "",
        ...Array.from({ length: THIS_YEAR - 2008 + 1 }, (_, i) =>
          String(2008 + i),
        ),
      ]);
      expect(years("To")[1]).toBe(String(THIS_YEAR));
      expect(last(years("To"))).toBe("2008");
    });

    it("offer nothing that would invert the range", () => {
      setUrl("/?from=2015-01-01&to=2019-12-31");
      render(YearRangePicker);

      expect(last(years("From"))).toBe("2019");
      expect(last(years("To"))).toBe("2015");
    });

    it("show a year from outside the span rather than reading blank", () => {
      setUrl("/?to=1999-12-31");
      render(YearRangePicker);

      expect(select("To").value).toBe("1999");
    });
  });

  describe("All", () => {
    it("clears both ends", async () => {
      setUrl("/?from=2015-01-01&to=2019-12-31");
      render(YearRangePicker);

      await userEvent.click(screen.getByRole("button", { name: "All" }));

      expect(params().has("from")).toBe(false);
      expect(params().has("to")).toBe(false);
    });

    it("is absent until a year is set", () => {
      render(YearRangePicker);

      expect(screen.queryByRole("button", { name: "All" })).toBeNull();
    });

    it("is there for either end alone", () => {
      setUrl("/?to=2019-12-31");
      render(YearRangePicker);

      expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    });
  });
});
