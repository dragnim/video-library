// Grid or list, for every route that renders a list of videos.

// In memory: it resets on reload. Storing it would require user consent.
let isGrid = $state(true);

export const layout = {
  get isGrid(): boolean {
    return isGrid;
  },

  set isGrid(next: boolean) {
    isGrid = next;
  },
};
