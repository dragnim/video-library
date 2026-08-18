// Clicking a credit is the app's main way into a filtered list: it has to land
// on /search, show the filter in the panel that owns it, and drop the featured
// strip that says this is the front page.

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.svelte";
import { location } from "../../src/lib/router/location.svelte";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

/** The strip is the only labelled landmark on the page. */
function featuredStrip() {
  return screen.queryByRole("region", { name: "Featured" });
}

/** Credits only appear once the roster can name the ids. */
async function firstCredit(name: string) {
  return await vi.waitFor(() => screen.getAllByRole("link", { name })[0]);
}

describe("the featured strip", () => {
  it("is on the front page", async () => {
    setUrl("/");
    render(App);

    await vi.waitFor(() => expect(featuredStrip()).toBeInTheDocument());
  });

  it("is not on a search", async () => {
    setUrl("/search?q=apl");
    render(App);

    await screen.findByText(/Showing \d+ results/);
    expect(featuredStrip()).toBeNull();
  });

  // Reachable by hand, and by the advanced panel rerunning on /.
  it("is not on a filtered front page", async () => {
    setUrl("/?event=dyalog-22");
    render(App);

    await screen.findByText(/Showing \d+ results/);
    expect(featuredStrip()).toBeNull();
  });

  it("survives a sort, which is not a search", async () => {
    setUrl("/?sort=oldest");
    render(App);

    await vi.waitFor(() => expect(featuredStrip()).toBeInTheDocument());
  });
});

describe("clicking a presenter credit", () => {
  it("searches for that presenter and shows the filter in the panel", async () => {
    setUrl("/");
    render(App);

    await userEvent.click(await firstCredit("John Smith"));

    expect(location.pathname).toBe("/search");
    expect(new URLSearchParams(location.search).get("presenter_id")).toBe("1");

    // The panel opens because an advanced filter arrived, and the token is a
    // view over the URL rather than a copy the click had to populate.
    expect(
      await screen.findByRole("button", { name: "Remove John Smith filter" }),
    ).toBeInTheDocument();
  });

  it("replaces the query rather than narrowing it further", async () => {
    setUrl("/search?q=apl");
    render(App);

    await userEvent.click(await firstCredit("John Smith"));

    // dvl's behaviour: a credit starts a new search for that presenter.
    expect(new URLSearchParams(location.search).has("q")).toBe(false);
  });
});

describe("clicking an event credit", () => {
  it("searches for that event and selects it in the panel", async () => {
    setUrl("/");
    render(App);

    await userEvent.click(await firstCredit("Dyalog '22"));

    expect(location.pathname).toBe("/search");
    expect(new URLSearchParams(location.search).get("event")).toBe("dyalog-22");

    const select = await screen.findByLabelText<HTMLSelectElement>("Event");
    expect(select.value).toBe("dyalog-22");
  });
});

describe("getting back to the front page", () => {
  it("is what the Videos tab does from a search", async () => {
    setUrl("/search?q=apl&event=dyalog-22");
    render(App);

    await userEvent.click(screen.getByRole("link", { name: "Videos" }));

    expect(location.pathname).toBe("/");
    expect(location.search).toBe("");
    await vi.waitFor(() => expect(featuredStrip()).toBeInTheDocument());
  });

  it("is what the Video Library heading does", async () => {
    setUrl("/search?q=apl");
    render(App);

    // The heading holds a non-breaking space, which \s matches and " " does not.
    await userEvent.click(screen.getByRole("link", { name: /Video\sLibrary/ }));

    expect(location.pathname).toBe("/");
    expect(location.search).toBe("");
  });
});
