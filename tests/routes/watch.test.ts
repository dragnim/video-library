// The page's four states, the consent gate, and the deep links a description
// and the credits produce. The tokeniser has its own suite.

import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import Watch from "../../src/routes/Watch.svelte";
import { apiVideos } from "../../src/lib/env";
import { location } from "../../src/lib/router/location.svelte";
import { server } from "../mocks/server";

function setUrl(search: string) {
  window.history.replaceState(null, "", `/watch${search}`);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

/** One video, described however the test needs. */
function servesDescription(description: string) {
  server.use(
    http.get(`${apiVideos}/:id`, ({ params }) =>
      HttpResponse.json({
        youtube_id: params.id,
        title: "Introduction to APL",
        presenter_id: [1],
        event: "Dyalog '22",
        event_shortname: "dyalog-22",
        presented_at: "2022-09-11 00:00:00",
        published_at: "2022-09-15 10:30:00",
        description,
        thumbnail: "https://i.ytimg.com/vi/vid001/hqdefault.jpg",
      }),
    ),
  );
}

describe("loading", () => {
  it("shows a spinner before the video arrives", () => {
    setUrl("?v=vid001");
    render(Watch);

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });

  it("titles the document with the video once it arrives", async () => {
    setUrl("?v=vid001");
    render(Watch);

    expect(
      await screen.findByRole("heading", { level: 1 }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Introduction to APL - Dyalog Video Library");
  });
});

describe("the title", () => {
  // Everywhere else the title is the link to here; here it is the destination.
  it("is not a link to the page the viewer is already on", async () => {
    setUrl("?v=vid001");
    render(Watch);

    const heading = await screen.findByRole("heading", { level: 1 });
    expect(heading.querySelector("a")).toBeNull();
  });
});

describe("the states a video can be in", () => {
  it("says the video is unavailable on a 404", async () => {
    setUrl("?v=notfound");
    render(Watch);

    expect(await screen.findByText(/not available/)).toBeInTheDocument();
  });

  // A dead API must not claim the video was deleted.
  it("distinguishes a failed request from a missing video", async () => {
    server.use(
      http.get(
        `${apiVideos}/:id`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    setUrl("?v=vid001");
    render(Watch);

    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });

  it("leaves /watch with no v, since there is nothing to show", () => {
    setUrl("");
    render(Watch);

    expect(location.pathname).toBe("/");
  });
});

describe("the way back", () => {
  // No browse destination is current on a leaf, so the page says so itself.
  it("offers Back when the viewer arrived through the app", async () => {
    setUrl("?v=vid001");
    // A push of ours behind this entry, which is what makes Back ours to offer.
    window.history.pushState({ key: "k", depth: 1 }, "", "/watch?v=vid001");
    window.dispatchEvent(
      new PopStateEvent("popstate", { state: { key: "k", depth: 1 } }),
    );
    render(Watch);

    expect(
      await screen.findByRole("button", { name: /Back/ }),
    ).toBeInTheDocument();
  });

  it("offers the library instead on a cold deep link", async () => {
    setUrl("?v=vid001");
    render(Watch);

    // Nothing of ours behind this entry, so Back would leave the site.
    expect(screen.queryByRole("button", { name: /Back/ })).toBeNull();
    expect(
      await screen.findByRole("link", { name: /Library/ }),
    ).toHaveAttribute("href", "/");
  });
});

describe("the consent gate", () => {
  it("contacts nothing until the viewer asks, then embeds nocookie", async () => {
    setUrl("?v=vid001");
    render(Watch);

    const gate = await screen.findByRole("button", { name: /YouTube/ });
    expect(document.querySelector("iframe")).toBeNull();

    await userEvent.click(gate);

    expect(document.querySelector("iframe")?.getAttribute("src")).toContain(
      "https://www.youtube-nocookie.com/embed/vid001",
    );
  });

  it("starts the player where ?time= points", async () => {
    setUrl("?v=vid001&time=535");
    render(Watch);

    await userEvent.click(
      await screen.findByRole("button", { name: /YouTube/ }),
    );

    const src = document.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(new URL(src).searchParams.get("start")).toBe("535");
  });

  it("ignores a ?time= that is not a number", async () => {
    setUrl("?v=vid001&time=abc");
    render(Watch);

    await userEvent.click(
      await screen.findByRole("button", { name: /YouTube/ }),
    );

    const src = document.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(new URL(src).searchParams.has("start")).toBe(false);
  });
});

describe("the description", () => {
  it("turns a chapter mark into a deep link into this video", async () => {
    servesDescription("8:55 Dfns");
    setUrl("?v=vid001");
    render(Watch);

    expect(await screen.findByRole("link", { name: "8:55" })).toHaveAttribute(
      "href",
      "/watch?v=vid001&time=535",
    );
  });

  it("opens an external address in a new tab", async () => {
    servesDescription("see dyalog.com");
    setUrl("?v=vid001");
    render(Watch);

    const link = await screen.findByRole("link", { name: "dyalog.com" });
    expect(link).toHaveAttribute("href", "https://dyalog.com");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("structured data", () => {
  it("describes the video for crawlers that never see the embed", async () => {
    setUrl("?v=vid001");
    render(Watch);
    await screen.findByRole("heading", { level: 1 });

    const script = document.head.querySelector(
      'script[type="application/ld+json"]',
    );
    const data = JSON.parse(script?.textContent ?? "{}") as Record<
      string,
      unknown
    >;

    expect(data["@type"]).toBe("VideoObject");
    expect(data.name).toBe("Introduction to APL");
    expect(data.embedUrl).toBe("https://www.youtube-nocookie.com/embed/vid001");
  });
});
