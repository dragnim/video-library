<script lang="ts">
  import type { Video } from "../../lib/api/types";
  import VideoCard from "./VideoCard.svelte";

  let { items }: { items: Video[] } = $props();
</script>

<!-- Nothing at all when there are no items: a zero-result list is the page's
     empty state, and the footer distinguishes it from a list still loading. -->
{#if items.length > 0}
  <!-- Keyed on the id alone. An index in the key, as dvl has, makes Svelte
       reconcile by position: a reordered list rewrites every card in place
       instead of moving the one that moved. -->
  <div class="grid">
    {#each items as video (video.youtubeId)}
      <VideoCard {video} />
    {/each}
  </div>
{/if}

<style>
  /* The tier tokens are set in app.css, where the two breakpoints live: a
     media query cannot read a custom property, so the tiers can only be
     declared once somewhere both this grid and the skeleton grid can read. */
  .grid {
    display: grid;
    grid-template-columns: repeat(
      var(--dyalog-video-library-grid-columns),
      1fr
    );
    gap: var(--dyalog-video-library-grid-gap);
  }
</style>
