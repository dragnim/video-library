// The engine needs an owner for its $effect and a reactive filter source. Runes
// only compile in .svelte.ts, so the harness lives here and the tests stay
// plain TypeScript.

import { flushSync } from "svelte";
import {
  createVideoList,
  type ListMode,
  type VideoList,
} from "../../src/lib/data/videoList.svelte";
import {
  DEFAULT_FILTERS,
  type BrowseFilters,
} from "../../src/lib/utils/browseFilters";

export interface Harness {
  list: VideoList;
  /** Changes the filters the engine reads, then runs its effect. */
  patch(next: Partial<BrowseFilters>): void;
  cleanup(): void;
}

export function createHarness(options: {
  mode?: ListMode;
  filters?: Partial<BrowseFilters>;
  onSettled?: (page: number) => void;
}): Harness {
  let current = $state<BrowseFilters>({
    ...DEFAULT_FILTERS,
    ...options.filters,
  });

  let list!: VideoList;
  const cleanup = $effect.root(() => {
    list = createVideoList({
      mode: options.mode ?? "infinite",
      filters: () => current,
      onSettled: options.onSettled,
    });
  });

  flushSync();

  return {
    list,
    patch(next) {
      current = { ...current, ...next };
      flushSync();
    },
    cleanup,
  };
}
