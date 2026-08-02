// PLAN.md singles this out: a missed modifier-key check silently breaks
// cmd-click, so every interception rule gets its own case.

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/svelte";
import LinkHost from "./LinkHost.svelte";
import LinkPreventedHost from "./LinkPreventedHost.svelte";
import { location } from "../../src/lib/router/location.svelte";

// location's own state only follows real navigation/popstate, so resetting
// window.location between tests needs a synthetic popstate to bring it along.
function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("rendering", () => {
  it("renders a real anchor with the href", () => {
    setUrl("/");
    render(LinkHost, { props: { href: "/search?q=apl" } });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/search?q=apl");
  });
});

describe("interception", () => {
  it("a plain left click navigates without a page load", async () => {
    setUrl("/");
    render(LinkHost, { props: { href: "/search?q=apl" } });

    await fireEvent.click(screen.getByRole("link"));

    expect(location.pathname).toBe("/search");
    expect(location.search).toBe("?q=apl");
  });

  it.each(["metaKey", "ctrlKey", "shiftKey", "altKey"])(
    "%s lets the browser handle the click",
    async (modifier) => {
      setUrl("/");
      render(LinkHost, { props: { href: "/watch?v=1" } });

      await fireEvent.click(screen.getByRole("link"), { [modifier]: true });

      expect(location.pathname).toBe("/");
    },
  );

  it("a middle click (button 1) lets the browser handle it", async () => {
    setUrl("/");
    render(LinkHost, { props: { href: "/watch?v=1" } });

    await fireEvent.click(screen.getByRole("link"), { button: 1 });

    expect(location.pathname).toBe("/");
  });

  it("target=_blank lets the browser handle it", async () => {
    setUrl("/");
    render(LinkHost, { props: { href: "/watch?v=1", target: "_blank" } });

    await fireEvent.click(screen.getByRole("link"));

    expect(location.pathname).toBe("/");
  });

  it("a handler that already called preventDefault is left alone", async () => {
    setUrl("/");
    render(LinkPreventedHost, { props: { href: "/watch?v=1" } });

    await fireEvent.click(screen.getByRole("button"));

    expect(location.pathname).toBe("/");
  });

  it("runs a caller's onclick before navigating", async () => {
    setUrl("/");
    const spy = vi.fn();
    render(LinkHost, { props: { href: "/watch?v=1", onclick: spy } });

    await fireEvent.click(screen.getByRole("link"));

    expect(spy).toHaveBeenCalledOnce();
    expect(location.pathname).toBe("/watch");
  });

  it("a caller's onclick can preventDefault to keep the click", async () => {
    setUrl("/");
    const onclick = (event: MouseEvent) => event.preventDefault();
    render(LinkHost, { props: { href: "/watch?v=1", onclick } });

    await fireEvent.click(screen.getByRole("link"));

    expect(location.pathname).toBe("/");
  });

  it("an external href is left alone", async () => {
    setUrl("/");
    render(LinkHost, { props: { href: "https://example.com/elsewhere" } });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/elsewhere");

    await fireEvent.click(link);

    expect(location.pathname).toBe("/");
  });
});

describe("basename", () => {
  // resetModules() must carry the Svelte runtime and testing-library along
  // with it: mounting a freshly-imported component through the old `render`
  // mixes two Svelte runtime instances and crashes, so this reimports both.
  it("prepends the basename in the rendered href but not in location.pathname", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library");
    vi.resetModules();

    const {
      render: freshRender,
      screen: freshScreen,
      fireEvent: freshFireEvent,
    } = await import("@testing-library/svelte");
    const FreshLinkHost = (await import("./LinkHost.svelte")).default;
    const { location: freshLocation } =
      await import("../../src/lib/router/location.svelte");

    freshRender(FreshLinkHost, { props: { href: "/search?q=apl" } });
    const link = freshScreen.getByRole("link");
    expect(link).toHaveAttribute("href", "/video-library/search?q=apl");

    await freshFireEvent.click(link);

    expect(freshLocation.pathname).toBe("/search");
  });

  it("does not prepend the basename twice to an href that already carries it", async () => {
    vi.stubEnv("VITE_BASENAME", "/video-library");
    setUrl("/video-library");
    vi.resetModules();

    const { render: freshRender } = await import("@testing-library/svelte");
    const FreshLinkHost = (await import("./LinkHost.svelte")).default;

    // Scoped to this render's container: the reimported testing-library has
    // its own cleanup registry, so the case above is still in the document.
    const { container } = freshRender(FreshLinkHost, {
      props: { href: "/video-library/search" },
    });

    expect(container.querySelector("a")).toHaveAttribute(
      "href",
      "/video-library/search",
    );
  });
});
