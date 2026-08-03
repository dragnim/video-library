<script lang="ts">
  // The footer over a real engine, which is the only way to drive the sentinel
  // and the button through the same handler.
  import InfiniteListFooter from "../../src/components/results/InfiniteListFooter.svelte";
  import { createVideoList } from "../../src/lib/data/videoList.svelte";
  import {
    DEFAULT_FILTERS,
    type BrowseFilters,
  } from "../../src/lib/utils/browseFilters";

  let { filters = {} }: { filters?: Partial<BrowseFilters> } = $props();

  const current: BrowseFilters = $derived({ ...DEFAULT_FILTERS, ...filters });
  const list = createVideoList({ mode: "infinite", filters: () => current });

  const loaded = $derived("items" in list.state ? list.state.items.length : 0);
</script>

<p data-testid="loaded">{loaded}</p>

<InfiniteListFooter
  state={list.state}
  loadMore={list.loadMore}
  retry={list.retry}
  noun="videos"
/>
