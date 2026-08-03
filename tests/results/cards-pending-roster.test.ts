// Its own file because the roster is module state and Vitest gives each file a
// fresh registry: here nothing has called loadRosters, so it is still loading.

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/svelte";
import VideoCard from "../../src/components/results/VideoCard.svelte";
import VideoRow from "../../src/components/results/VideoRow.svelte";
import { normaliseVideo } from "../../src/lib/api/normalise";
import { rosters } from "../../src/lib/state/rosters.svelte";

const video = normaliseVideo({
  youtube_id: "vid001",
  title: "Introduction to APL",
  presenter_id: [1, 2],
});

describe("before the roster lands", () => {
  it("is loading, which is what these cases depend on", () => {
    expect(rosters.status).toBe("loading");
  });

  it("leaves the card's presenter line out rather than showing ids", () => {
    const { container } = render(VideoCard, { props: { video } });

    expect(
      screen.getByRole("link", { name: /Introduction to APL/ }),
    ).toBeInTheDocument();
    expect(container.querySelector(".presenters")).toBeNull();
    expect(container.textContent).not.toContain("#1");
  });

  it("leaves the row's presenter line out too", () => {
    const { container } = render(VideoRow, { props: { video } });

    expect(container.querySelector(".presenters")).toBeNull();
    expect(container.textContent).not.toContain("#1");
  });
});
