// Both arrangements, with the roster loaded. Fixtures go through normaliseVideo
// so the defaults under test are the real ones.

import { beforeAll, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/svelte";
import VideoCard from "../../src/components/results/VideoCard.svelte";
import VideoRow from "../../src/components/results/VideoRow.svelte";
import { normaliseVideo } from "../../src/lib/api/normalise";
import { loadRosters, rosters } from "../../src/lib/state/rosters.svelte";
import { vi } from "vitest";

const video = normaliseVideo({
  youtube_id: "vid001",
  title: "Introduction to APL",
  presenter_id: [1, 2],
  event: "Dyalog '22",
  event_shortname: "dyalog-22",
  presented_at: "2022-09-11T00:00:00Z",
  description: "Learn APL basics in this comprehensive introduction",
  thumbnail: "https://i.ytimg.com/vi/vid001/hqdefault.jpg",
});

/** Every optional field absent, as a narrowed payload would arrive. */
const bare = normaliseVideo({ youtube_id: "vid404", title: "Bare minimum" });

beforeAll(async () => {
  loadRosters();
  await vi.waitFor(() => {
    expect(rosters.status).toBe("loaded");
  });
});

describe("VideoCard", () => {
  it("is one link to the video, titled by the video", () => {
    render(VideoCard, { props: { video } });

    const link = screen.getByRole("link", { name: /Introduction to APL/ });
    expect(link).toHaveAttribute("href", "/watch?v=vid001");
    // Decorative: the title in the same link names the destination.
    expect(screen.getByRole("presentation")).toHaveAttribute("alt", "");
  });

  it("names the presenters from the roster and links to their videos", () => {
    render(VideoCard, { props: { video } });

    const presenter = screen.getByRole("link", { name: "John Smith" });
    expect(presenter.getAttribute("href")).toContain("presenter_id=1");
    expect(screen.getByRole("link", { name: "Jane Doe" })).toBeInTheDocument();
  });

  it("links the event by its slug, labelled by its name", () => {
    render(VideoCard, { props: { video } });

    const event = screen.getByRole("link", { name: "Dyalog '22" });
    expect(event.getAttribute("href")).toContain("event=dyalog-22");
  });

  it("dates the talk with a short month", () => {
    render(VideoCard, { props: { video } });

    // en-GB abbreviates September to "Sept", not "Sep".
    expect(screen.getByText("Sept 2022")).toBeInTheDocument();
  });

  it("shows no description", () => {
    render(VideoCard, { props: { video } });

    expect(screen.queryByText(/comprehensive introduction/)).toBeNull();
  });

  it("renders a video with every optional field defaulted", () => {
    const { container } = render(VideoCard, { props: { video: bare } });

    expect(
      screen.getByRole("link", { name: "Bare minimum" }),
    ).toBeInTheDocument();
    // A placeholder rather than a broken image, from normaliseVideo.
    expect(container.querySelector("img")?.getAttribute("src")).toContain(
      "placeholder",
    );
    expect(container.textContent).not.toContain("Invalid Date");
    expect(container.textContent).not.toContain("undefined");
    expect(container.textContent).not.toContain("#");
  });

  it("labels an id the roster does not carry, keeping it clickable", () => {
    const unknown = normaliseVideo({
      youtube_id: "vid002",
      title: "Mystery talk",
      presenter_id: [999],
    });

    render(VideoCard, { props: { video: unknown } });

    const link = screen.getByRole("link", { name: "#999" });
    expect(link.getAttribute("href")).toContain("presenter_id=999");
  });

  it("joins a pair of presenters with an ampersand", () => {
    const { container } = render(VideoCard, { props: { video } });

    expect(container.textContent).toContain("John Smith & Jane Doe");
  });

  it("joins three presenters with commas", () => {
    const three = normaliseVideo({
      youtube_id: "vid003",
      title: "Panel",
      presenter_id: [1, 2, 3],
    });

    const { container } = render(VideoCard, { props: { video: three } });

    expect(container.textContent).toContain(
      "John Smith, Jane Doe, Alice Cooper",
    );
  });
});

describe("VideoRow", () => {
  it("titles the row with an h2, since the grid card's is an h3", () => {
    render(VideoRow, { props: { video } });

    expect(
      screen.getByRole("heading", { level: 2, name: "Introduction to APL" }),
    ).toBeInTheDocument();
  });

  it("links the thumbnail and the title separately", () => {
    render(VideoRow, { props: { video } });

    const toWatch = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/watch?v=vid001");
    expect(toWatch).toHaveLength(2);
  });

  it("shows the description the card leaves out", () => {
    render(VideoRow, { props: { video } });

    expect(screen.getByText(/comprehensive introduction/)).toBeInTheDocument();
  });

  it("leaves the description out when there is none", () => {
    const { container } = render(VideoRow, { props: { video: bare } });

    expect(container.querySelector(".description")).toBeNull();
  });

  it("dates the talk with a long month", () => {
    render(VideoRow, { props: { video } });

    expect(screen.getByText("September 2022")).toBeInTheDocument();
  });
});
