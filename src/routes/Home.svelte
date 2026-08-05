<script lang="ts">
  // Browsing starts here: the featured strip above the library.
  import FeaturedStrip from "../components/browse/FeaturedStrip.svelte";
  import Videos from "../components/browse/Videos.svelte";
  import { filters } from "../lib/state/filters.svelte";
  import { isSearch } from "../lib/utils/browseFilters";

  // The strip is what makes this the front page, so a filtered `/` is not one.
  // Reachable by hand-editing the URL, and by the advanced panel, which reruns
  // on the route it was opened from.
  const featured = $derived(!isSearch(filters.current));
</script>

<!-- App.svelte's title is the default. A route that keeps it still has to say so,
     or the title of the route the user came from survives the navigation back. -->
<svelte:head>
  <title>Dyalog Video Library</title>
</svelte:head>

{#if featured}
  <FeaturedStrip />
{/if}

<Videos />
