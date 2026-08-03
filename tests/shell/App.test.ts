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

    expect(screen.getByText("Browse all")).toBeInTheDocument();
  });

  it("renders home for a path no route claims", () => {
    setUrl("/nothing-here");
    render(App);

    expect(location.pathname).toBe("/nothing-here");
    expect(screen.getByText("Browse all")).toBeInTheDocument();
  });

  it("sets the document title", () => {
    setUrl("/");
    render(App);

    expect(document.title).toBe("Dyalog Video Library");
  });

  it("keeps the terms panel closed until asked", () => {
    setUrl("/");
    render(App);

    expect(
      screen.getByRole("button", { name: "Terms of Use" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
