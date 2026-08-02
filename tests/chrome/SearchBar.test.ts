import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/svelte";
import SearchBar from "../../src/components/chrome/SearchBar.svelte";
import { location } from "../../src/lib/router/location.svelte";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

describe("SearchBar", () => {
  it("submits to /search with no page load", async () => {
    setUrl("/");
    const { container } = render(SearchBar);

    await fireEvent.input(screen.getByRole("searchbox"), {
      target: { value: "apl" },
    });
    await fireEvent.submit(container.querySelector("form")!);

    expect(location.pathname).toBe("/search");
    expect(new URLSearchParams(location.search).get("q")).toBe("apl");
  });

  it("takes the input's value from the URL", () => {
    setUrl("/search?q=tacit");
    render(SearchBar);

    expect(screen.getByRole("searchbox")).toHaveValue("tacit");
  });

  // The name is matched loosely: the words are joined by a non-breaking
  // space, which testing-library does not normalise away.
  it("heads the page with an h1", () => {
    setUrl("/");
    render(SearchBar);

    expect(
      screen.getByRole("heading", { level: 1, name: /Video\s+Library/ }),
    ).toBeInTheDocument();
  });

  it("steps down to an h2 on a watch page, where the video title is the h1", () => {
    setUrl("/watch?v=abc");
    render(SearchBar);

    expect(
      screen.getByRole("heading", { level: 2, name: /Video\s+Library/ }),
    ).toBeInTheDocument();
  });
});
