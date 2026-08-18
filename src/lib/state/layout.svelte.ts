// Grid or list, for every route that renders a list of videos.

// In memory: it resets on reload. Storing it would require user consent.
let isGrid = $state(true);

/**
 * The 640px breakpoint, as a query.
 *
 * Duplicated from app.css because a media query is not readable from a custom
 * property. If the breakpoint moves, it moves in both places — the two-
 * breakpoint rule in tests/styles/css-foundations.test.ts is the reminder.
 */
const NARROW = "(max-width: 640px)";

let narrow = $state(false);

// Guarded: matchMedia is absent under the test environment, where the viewport
// is not a thing, and a list is the right thing to render there.
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const query = window.matchMedia(NARROW);
  narrow = query.matches;
  query.addEventListener("change", (event) => {
    narrow = event.matches;
  });
}

export const layout = {
  /**
   * Always a grid on a narrow screen.
   *
   * The arrangement control is hidden there, so honouring a list chosen on a
   * wide screen would strand someone in a layout with nothing to change it back
   * — a desktop window dragged narrow, or an orientation change. The choice
   * itself is kept, not overwritten, so widening again restores it.
   */
  get isGrid(): boolean {
    return narrow || isGrid;
  },

  set isGrid(next: boolean) {
    isGrid = next;
  },
};
