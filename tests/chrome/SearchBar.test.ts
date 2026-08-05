import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.svelte";
import SearchBar from "../../src/components/chrome/SearchBar.svelte";
import { location } from "../../src/lib/router/location.svelte";
import { searchPanel } from "../../src/lib/state/searchPanel.svelte";
import { server } from "../mocks/server";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function toggle() {
  return screen.getByRole("button", { name: "Advanced Options" });
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

describe("the advanced-options toggle", () => {
  it("names a panel that is empty until it is opened", async () => {
    setUrl("/");
    // The panel is a session's worth of state, so a case about the closed panel
    // says so rather than depending on the case before it.
    searchPanel.open = false;
    render(SearchBar);
    const panel = document.getElementById(
      toggle().getAttribute("aria-controls")!,
    )!;

    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(panel).toBeEmptyDOMElement();

    await userEvent.click(toggle());

    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Event")).toBeInTheDocument();
  });

  it("leaves no panel control reachable by Tab while closed", async () => {
    setUrl("/");
    searchPanel.open = false;
    render(SearchBar);

    // react-collapsible keeps dvl's children mounted, so its closed panel holds
    // a dozen focus stops.
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(screen.queryByLabelText("Event")).toBeNull();
      expect(screen.queryByLabelText("Presenter")).toBeNull();
    }
  });

  it("issues no request: the panel is a rune, not a filter", async () => {
    // An `adv=1` param would reach the list engine's identity, and opening the
    // panel would refetch the list.
    const requests: string[] = [];
    server.events.on("request:start", ({ request }) => {
      requests.push(new URL(request.url).pathname);
    });
    setUrl("/");
    render(App);

    await vi.waitFor(() => {
      expect(screen.getByText("Browse all 15")).toBeInTheDocument();
    });
    const settled = requests.length;

    await userEvent.click(toggle());
    await userEvent.click(toggle());

    expect(requests).toHaveLength(settled);
    server.events.removeAllListeners();
  });
});
