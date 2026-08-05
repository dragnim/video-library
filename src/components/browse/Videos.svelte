<script lang="ts">
  // The library as one infinitely scrolled list: the filter bar, the grid/list
  // branch and the empty state. It owns the engine, so the engine lives and dies
  // with the view rather than outliving it behind another one.
  import BrowseBar from "./BrowseBar.svelte";
  import InfiniteListFooter from "../results/InfiniteListFooter.svelte";
  import ResultGrid from "../results/ResultGrid.svelte";
  import ResultList from "../results/ResultList.svelte";
  import { createVideoList } from "../../lib/data/videoList.svelte";
  import { onSettled } from "../../lib/router/onSettled";
  import { filters, setFilters } from "../../lib/state/filters.svelte";
  import { layout } from "../../lib/state/layout.svelte";
  import { BROWSE_SORTS, DEFAULT_FILTERS } from "../../lib/utils/browseFilters";

  // /search offers relevance as well, so the choice belongs to the route.
  let { sorts = BROWSE_SORTS }: { sorts?: string[] } = $props();

  const list = createVideoList({
    mode: "infinite",
    filters: () => filters.current,
    onSettled,
  });

  const items = $derived("items" in list.state ? list.state.items : []);
  const total = $derived("total" in list.state ? list.state.total : null);
  const empty = $derived(list.state.kind === "ready" && list.state.total === 0);
</script>

<BrowseBar {total} {sorts} />

{#if layout.isGrid}
  <ResultGrid {items} />
{:else}
  <ResultList {items} />
{/if}

<!-- Filters that match nothing get a way out. The bar stays above it, so the
     filters the user has to remove are still on screen. -->
{#if empty}
  <p class="empty">
    No videos match these filters.
    <button
      type="button"
      class="clear"
      onclick={() => setFilters(DEFAULT_FILTERS)}
    >
      Clear filters
    </button>
  </p>
{/if}

<InfiniteListFooter
  state={list.state}
  loadMore={list.loadMore}
  retry={list.retry}
  noun="videos"
/>

<style>
  .empty {
    padding: 3rem 0;
    text-align: center;
    color: var(--dyalog-video-library-muted);
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. */
  :global(#dyalog-video-library) .clear {
    padding: 0.5rem 1rem;
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-primary);
    font-weight: 600;
    cursor: pointer;
  }
</style>
