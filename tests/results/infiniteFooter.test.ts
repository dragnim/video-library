// The tail of the list: what each engine state renders, and the sentinel driven
// through the stub rather than around it.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FooterHost from "./FooterHost.svelte";
import InfiniteListFooter from "../../src/components/results/InfiniteListFooter.svelte";
import { normaliseVideo } from "../../src/lib/api/normalise";
import type { ListState } from "../../src/lib/data/videoList.svelte";
import { apiVideos } from "../../src/lib/env";
import {
  installIntersectionObserver,
  type MockIntersectionObserver,
} from "../mocks/intersectionObserver";
import { server } from "../mocks/server";

const items = [normaliseVideo({ youtube_id: "v1", title: "One" })];

function footer(state: ListState) {
  return render(InfiniteListFooter, {
    props: { state, loadMore: () => {}, retry: () => {}, noun: "videos" },
  });
}

let observer: MockIntersectionObserver;

beforeEach(() => {
  observer = installIntersectionObserver();
});

afterEach(() => {
  observer.restore();
  server.events.removeAllListeners();
});

describe("InfiniteListFooter", () => {
  it("observes the sentinel ahead of the viewport", () => {
    footer({ kind: "loading" });

    expect(observer.observedCount()).toBe(1);
    expect(observer.instances[0].options?.rootMargin).toBe("600px");
  });

  it("announces the first load and an appending one differently", () => {
    footer({ kind: "loading" });
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");

    footer({ kind: "appending", items, total: 15 });
    expect(screen.getAllByRole("status")[1]).toHaveTextContent("Loading more…");
  });

  it("keeps Load more focusable while a page is loading", () => {
    footer({ kind: "appending", items, total: 15 });

    const button = screen.getByRole("button", { name: "Load more" });
    button.focus();

    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(document.activeElement).toBe(button);
  });

  it("offers Retry on an error rather than a dead end", () => {
    footer({ kind: "error", error: new Error("nope"), items });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't load more videos.",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("counts the list once it is exhausted", () => {
    footer({ kind: "ready", items, total: 1, exhausted: true });

    expect(screen.getByText("That's all 1 videos.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("says nothing about a list with no results", () => {
    // The page's empty state covers it, so not "That's all 0 videos".
    footer({ kind: "ready", items: [], total: 0, exhausted: true });

    expect(screen.queryByText(/That's all/)).toBeNull();
  });
});

/** Every request the mock server sees, in order. */
function recordRequests() {
  const seen: URL[] = [];
  server.events.on("request:start", ({ request }) => {
    seen.push(new URL(request.url));
  });
  return seen;
}

/** Five at a time over the mock library's 15 videos. */
const PERPAGE = 5;

async function loadedCount(count: number) {
  await vi.waitFor(() => {
    expect(screen.getByTestId("loaded")).toHaveTextContent(String(count));
  });
}

describe("the sentinel over the engine", () => {
  it("loads one page per fire", async () => {
    render(FooterHost, { props: { filters: { perpage: PERPAGE } } });
    await loadedCount(5);

    observer.intersect();
    await loadedCount(10);

    observer.intersect();
    await loadedCount(15);
  });

  it("ignores a fire while a page is in flight", async () => {
    const requests = recordRequests();
    render(FooterHost, { props: { filters: { perpage: PERPAGE } } });
    await loadedCount(5);

    observer.intersect();
    observer.intersect();
    await loadedCount(10);

    expect(requests).toHaveLength(2);
  });

  it("ignores a fire before the first page has settled", async () => {
    const requests = recordRequests();
    render(FooterHost, { props: { filters: { perpage: PERPAGE } } });

    observer.intersect();
    await loadedCount(5);

    expect(requests).toHaveLength(1);
  });

  it("loads the same page from the button as from the sentinel", async () => {
    render(FooterHost, { props: { filters: { perpage: PERPAGE } } });
    await loadedCount(5);

    await userEvent.click(screen.getByRole("button", { name: "Load more" }));

    await loadedCount(10);
  });

  it("re-issues the failed page from Retry", async () => {
    render(FooterHost, { props: { filters: { perpage: PERPAGE } } });
    await loadedCount(5);

    server.use(
      http.get(apiVideos, () => new HttpResponse(null, { status: 500 })),
    );
    observer.intersect();
    await vi.waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    server.resetHandlers();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    await loadedCount(10);
  });
});
