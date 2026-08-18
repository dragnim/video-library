// The shell's one decision worth pinning: `/` is the catch-all, so a path no
// route claims renders home rather than nothing.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/svelte";
import App from "../../src/App.svelte";
import { location } from "../../src/lib/router/location.svelte";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

describe("the shell", () => {
  it("renders the home route at /", () => {
    setUrl("/");
    render(App);

    expect(screen.getByText("Browse all videos")).toBeInTheDocument();
  });

  it("renders the presenter list at /presenters", async () => {
    setUrl("/presenters");
    render(App);

    expect(
      await screen.findByRole("heading", { name: "Alice Cooper", level: 3 }),
    ).toBeInTheDocument();
  });

  it("renders home for a path no route claims", () => {
    setUrl("/nothing-here");
    render(App);

    expect(location.pathname).toBe("/nothing-here");
    expect(screen.getByText("Browse all videos")).toBeInTheDocument();
  });

  it("sets the document title", () => {
    setUrl("/");
    render(App);

    expect(document.title).toBe("Dyalog Video Library");
  });

  it("renders the terms at /terms rather than in a panel on every page", () => {
    setUrl("/terms");
    render(App);

    expect(
      screen.getByRole("heading", { name: "Terms of Use", level: 2 }),
    ).toBeInTheDocument();
  });

  it("keeps the terms off the pages that are not the terms", () => {
    setUrl("/");
    render(App);

    expect(screen.queryByText(/Acceptance of Terms/)).toBeNull();
  });
});
