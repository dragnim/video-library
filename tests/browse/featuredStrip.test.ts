// Four slots, four requests, and what each one does when its video is not there.

import { render, screen } from "@testing-library/svelte";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import FeaturedStrip from "../../src/components/browse/FeaturedStrip.svelte";
import type { FeaturedConfig } from "../../src/lib/config";
import { apiVideos } from "../../src/lib/env";
import { loadRosters, rosters } from "../../src/lib/state/rosters.svelte";
import { server } from "../mocks/server";

function config(over: Partial<FeaturedConfig> = {}): FeaturedConfig {
  return {
    hero: "vid001",
    heroEyebrow: "",
    secondaryIds: [],
    eventSlug: null,
    ...over,
  };
}

/** Every request the mock server sees, in order. */
function recordRequests() {
  const seen: URL[] = [];
  server.events.on("request:start", ({ request }) => {
    seen.push(new URL(request.url));
  });
  return seen;
}

async function heroTitle(title: string) {
  await vi.waitFor(() => {
    expect(screen.getByText(title)).toBeInTheDocument();
  });
}

/**
 * For the cases that assert nothing rendered, which would pass before the
 * requests had even been made.
 */
async function loaded(requests: URL[], count: number) {
  await vi.waitFor(() => {
    expect(requests).toHaveLength(count);
  });
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeAll(async () => {
  loadRosters();
  await vi.waitFor(() => {
    expect(rosters.status).toBe("loaded");
  });
});

afterEach(() => {
  server.events.removeAllListeners();
});

describe("FeaturedStrip", () => {
  it("renders the configured slots in order", async () => {
    render(FeaturedStrip, {
      props: {
        config: config({
          heroEyebrow: "Editor's pick",
          secondaryIds: ["vid002", "vid003"],
          eventSlug: "dyalog-22",
        }),
      },
    });

    await heroTitle("Introduction to APL");

    expect(screen.getByText("Editor's pick")).toBeInTheDocument();
    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toEqual([
      "/watch?v=vid001",
      "/watch?v=vid002",
      "/watch?v=vid003",
      "/?event=dyalog-22",
    ]);
  });

  it("counts the event, rather than the rows it asked for", async () => {
    render(FeaturedStrip, {
      props: { config: config({ eventSlug: "dyalog-22" }) },
    });

    await heroTitle("Introduction to APL");

    // Five of the mock library's videos are Dyalog '22.
    expect(screen.getByText(/5\s+videos/)).toBeInTheDocument();
  });

  it("leaves a slot whose video is gone empty, and keeps the rest", async () => {
    render(FeaturedStrip, {
      props: { config: config({ secondaryIds: ["notfound", "vid003"] }) },
    });

    await heroTitle("Introduction to APL");

    expect(screen.getByText("Dfns Workshop")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("renders nothing at all when the hero is gone", async () => {
    const requests = recordRequests();
    const { container } = render(FeaturedStrip, {
      props: { config: config({ hero: "notfound", secondaryIds: ["vid003"] }) },
    });

    await loaded(requests, 2);

    expect(container.querySelector("section")).toBeNull();
  });

  it("requests nothing for a slot that is not configured", async () => {
    const requests = recordRequests();
    render(FeaturedStrip, { props: { config: config() } });

    await heroTitle("Introduction to APL");

    expect(requests).toHaveLength(1);
    expect(requests[0].pathname).toBe("/videos/vid001");
  });

  it("credits the hero's presenters and event", async () => {
    render(FeaturedStrip, { props: { config: config({ hero: "vid003" }) } });

    await heroTitle("Dfns Workshop");

    expect(
      screen.getByText("John Smith & Jane Doe · Dyalog '22"),
    ).toBeInTheDocument();
  });

  it("falls back to the three newest videos in one request", async () => {
    const requests = recordRequests();
    render(FeaturedStrip, { props: { config: null } });

    await heroTitle("Introduction to APL");

    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.get("per_page")).toBe("3");
    expect(requests[0].searchParams.get("sort")).toBe("newest");
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });

  it("renders nothing with nothing configured and nothing returned", async () => {
    server.use(
      http.get(apiVideos, () =>
        HttpResponse.json({ data: [], total: 0, current_page: 1, per_page: 3 }),
      ),
    );

    const requests = recordRequests();
    const { container } = render(FeaturedStrip, { props: { config: null } });

    await loaded(requests, 1);

    expect(container.querySelector("section")).toBeNull();
  });
});
