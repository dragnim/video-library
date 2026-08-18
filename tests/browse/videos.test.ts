// That the view is wired, not that it is pretty: the engine, the bar's total,
// the sentinel and the empty state's way out.

import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import Videos from "../../src/components/browse/Videos.svelte";
import { location } from "../../src/lib/router/location.svelte";
import { loadRosters, rosters } from "../../src/lib/state/rosters.svelte";
import {
  installIntersectionObserver,
  type MockIntersectionObserver,
} from "../mocks/intersectionObserver";
import { server } from "../mocks/server";

function setUrl(path: string) {
  window.history.replaceState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

function recordListRequests() {
  const seen: URL[] = [];
  server.events.on("request:start", ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === "/videos") seen.push(url);
  });
  return seen;
}

async function cards(count: number) {
  await vi.waitFor(() => {
    expect(screen.getAllByRole("article")).toHaveLength(count);
  });
}

let observer: MockIntersectionObserver;

beforeAll(async () => {
  loadRosters();
  await vi.waitFor(() => {
    expect(rosters.status).toBe("loaded");
  });
});

beforeEach(() => {
  observer = installIntersectionObserver();
});

afterEach(() => {
  observer.restore();
  server.events.removeAllListeners();
});

describe("Videos", () => {
  it("renders the first page, its total, and the next page on demand", async () => {
    setUrl("/?perpage=5");
    render(Videos);

    await cards(5);
    expect(
      screen.getByText("Browse all 15 videos from 4 presenters"),
    ).toBeInTheDocument();

    observer.intersect();

    await cards(10);
  });

  it("restores the pages a cold ?pg= names in one request", async () => {
    const requests = recordListRequests();
    setUrl("/?pg=3&perpage=5");
    render(Videos);

    await cards(15);

    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get("page")).toBe("1");
    expect(requests[0].searchParams.get("per_page")).toBe("15");
  });

  // The engine is per-mount, so a tab click rebuilds it. The response cache is
  // what stops that costing another request.
  it("costs no request when the user comes back to it", async () => {
    const requests = recordListRequests();
    setUrl("/?perpage=5");

    const first = render(Videos);
    await cards(5);
    first.unmount();

    render(Videos);
    await cards(5);

    expect(requests).toHaveLength(1);
  });

  it("offers a way out of filters that match nothing", async () => {
    setUrl("/?q=nonexistent");
    render(Videos);

    await vi.waitFor(() => {
      expect(
        screen.getByText(/No videos match these filters/),
      ).toBeInTheDocument();
    });
    // Not "That's all 0 videos", which is the footer's other branch.
    expect(screen.queryByText(/That's all/)).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Clear filters" }),
    );

    expect(new URLSearchParams(location.search).get("q")).toBeNull();
    await cards(15);
  });
});
