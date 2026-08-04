<script lang="ts">
  // Browsing starts here: the featured strip above the library.
  import FeaturedStrip from "../components/browse/FeaturedStrip.svelte";
  import Videos from "../components/browse/Videos.svelte";
</script>

<!-- App.svelte's title is the default. A route that keeps it still has to say so,
     or the title of the route the user came from survives the navigation back. -->
<svelte:head>
  <title>Dyalog Video Library</title>
</svelte:head>

<FeaturedStrip />

<Videos />
