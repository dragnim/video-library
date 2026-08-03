// Grid or list, for every route that renders a list of videos.

// In memory, as dvl's Redux flag was: it resets on reload. Storing it would be
// the app's first persisted preference, and a consent question with it.
let isGrid = $state(true);

export const layout = {
  get isGrid(): boolean {
    return isGrid;
  },

  set isGrid(next: boolean) {
    isGrid = next;
  },
};
