<script lang="ts">
  // A search is the videos view with filters in the URL, and no featured strip
  // above it. Every credit link and the search form land here.
  import Videos from "../components/browse/Videos.svelte";
  import { filters } from "../lib/state/filters.svelte";
  import { BROWSE_SORTS, SEARCH_SORTS } from "../lib/utils/browseFilters";

  // Relevance is only offered against a query: with nothing to be relevant to,
  // the API's relevance order is arbitrary.
  const sorts = $derived(
    filters.current.q === "" ? BROWSE_SORTS : SEARCH_SORTS,
  );
</script>

<!-- Stated even though it matches App.svelte's, or the title of the route the
     user came from survives the navigation. -->
<svelte:head>
  <title>Dyalog Video Library</title>
</svelte:head>

<Videos {sorts} />
