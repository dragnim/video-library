<script lang="ts">
  let { count = 3 }: { count?: number } = $props();
</script>

<!-- The incoming row of cards, standing in for them until they arrive. -->
<div class="skeletons" aria-hidden="true">
  {#each Array.from({ length: count })}
    <div class="skeleton"></div>
  {/each}
</div>

<style>
  /* The tier tokens app.css sets, so the placeholders land where the cards
     they stand in for will. */
  .skeletons {
    position: relative;
    display: grid;
    grid-template-columns: repeat(
      var(--dyalog-video-library-grid-columns),
      1fr
    );
    gap: var(--dyalog-video-library-grid-gap);
  }

  /* An opaque overlay in the page background, so the row dissolves downward into
     the page. A mask-image reads alpha only, which makes the colour stops inert
     and runs the fade the other way. color-mix, since a var() cannot go inside
     rgba() and both stops are the page background at an alpha. */
  .skeletons::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--dyalog-video-library-page-bg) 0%, transparent),
      color-mix(in srgb, var(--dyalog-video-library-page-bg) 96%, transparent)
        65%
    );
    pointer-events: none;
  }

  .skeleton {
    height: 190px;
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-skeleton);
  }
</style>
