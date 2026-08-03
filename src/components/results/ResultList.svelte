<script lang="ts">
  import type { Video } from "../../lib/api/types";
  import VideoRow from "./VideoRow.svelte";

  let { items }: { items: Video[] } = $props();
</script>

{#if items.length > 0}
  <!-- Same key as the grid, for the same reason. -->
  <div class="list">
    {#each items as video (video.youtubeId)}
      <VideoRow {video} />
    {/each}
  </div>
{/if}

<style>
  .list {
    display: grid;
    gap: var(--dyalog-video-library-grid-gap);
  }
</style>
