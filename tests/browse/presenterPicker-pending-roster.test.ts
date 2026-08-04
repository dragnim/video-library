// Its own file because the roster is module state and Vitest gives each file a
// fresh registry: here nothing has called loadRosters, so it is still loading.

import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import PresenterPicker from "../../src/components/browse/PresenterPicker.svelte";
import { rosters } from "../../src/lib/state/rosters.svelte";

describe("before the roster lands", () => {
  it("is loading, which is what this case depends on", () => {
    expect(rosters.status).toBe("loading");
  });

  it("leaves an unresolved id unnamed, and still removable", () => {
    window.history.replaceState(null, "", "/?presenter_id=412");
    window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
    render(PresenterPicker);

    // #412 is what an id shows once the roster is loaded and it genuinely is
    // absent, which is not the same fact as a roster still in flight.
    expect(screen.queryByText(/#412/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Remove filter" }),
    ).toBeInTheDocument();
  });
});
