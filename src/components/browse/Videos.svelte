<script lang="ts">
  import FeaturedStrip from "./FeaturedStrip.svelte";
  import ResultGrid from "../results/ResultGrid.svelte";
  import ResultList from "../results/ResultList.svelte";
  import InfiniteListFooter from "../results/InfiniteListFooter.svelte";
  import { createVideoList } from "../../lib/data/videoList.svelte";
  import { layout } from "../../lib/state/layout.svelte";
  import { filters } from "../../lib/state/filters.svelte";
  import { onSettled } from "../../lib/router/onSettled";

  const list = createVideoList({
    mode: "infinite",
    filters: () => filters.current,
    onSettled,
  });

  const items = $derived("items" in list.state ? list.state.items : []);
  const total = $derived("total" in list.state ? list.state.total : null);
  const empty = $derived(list.state.kind === "ready" && list.state.total === 0);
</script>

<FeaturedStrip />

<p>Showing {total} items</p>

{#if layout.isGrid}
  <ResultGrid {items} />
{:else}
  <ResultList {items} />
{/if}

{#if empty}
  No videos found.
{/if}

<InfiniteListFooter
  state={list.state}
  loadMore={list.loadMore}
  retry={list.retry}
  noun="videos"
/>
