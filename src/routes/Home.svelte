<script lang="ts">
  // Browsing starts here: the featured strip, the filter bar, and the library as
  // one infinitely scrolled list. The page owns the engine, so it lives and dies
  // with the route rather than outliving it behind another one.
  import BrowseBar from "../components/browse/BrowseBar.svelte";
  import FeaturedStrip from "../components/browse/FeaturedStrip.svelte";
  import InfiniteListFooter from "../components/results/InfiniteListFooter.svelte";
  import ResultGrid from "../components/results/ResultGrid.svelte";
  import ResultList from "../components/results/ResultList.svelte";
  import { createVideoList } from "../lib/data/videoList.svelte";
  import { onSettled } from "../lib/router/onSettled";
  import { filters, setFilters } from "../lib/state/filters.svelte";
  import { layout } from "../lib/state/layout.svelte";
  import { DEFAULT_FILTERS } from "../lib/utils/browseFilters";

  const list = createVideoList({
    mode: "infinite",
    filters: () => filters.current,
    onSettled,
  });

  const items = $derived("items" in list.state ? list.state.items : []);
  const total = $derived("total" in list.state ? list.state.total : null);
  const empty = $derived(list.state.kind === "ready" && list.state.total === 0);
</script>

<!-- App.svelte's title is the default. A route that keeps it still has to say so,
     or the title of the route the user came from survives the navigation back. -->
<svelte:head>
  <title>Dyalog Video Library</title>
</svelte:head>

<FeaturedStrip />

<BrowseBar {total} />

{#if layout.isGrid}
  <ResultGrid {items} />
{:else}
  <ResultList {items} />
{/if}

<!-- Filters that match nothing get a way out. The bar stays above it, so the
     chips the user has to remove are still on screen. -->
{#if empty}
  <p class="empty">
    No videos match these filters.
    <button type="button" onclick={() => setFilters(DEFAULT_FILTERS)}>
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

  button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    background: #ffffff;
    color: var(--dyalog-video-library-primary);
    font-weight: 600;
    cursor: pointer;
  }
</style>
