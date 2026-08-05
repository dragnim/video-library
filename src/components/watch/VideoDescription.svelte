<script lang="ts">
  // The description as the author typed it, with the addresses and chapter
  // marks in it made clickable. Parsing is in utils/videoDescription.ts.
  import Link from "../../lib/router/Link.svelte";
  import { descriptionParagraphs } from "../../lib/utils/videoDescription";

  let {
    description,
    youtubeId,
  }: {
    description: string;
    /** Which video a chapter mark seeks within. */
    youtubeId: string;
  } = $props();

  const paragraphs = $derived(descriptionParagraphs(description));
</script>

<div class="description">
  <!-- Unkeyed, both blocks. A key has to identify the item, and tokens are
       re-derived from the description with nothing to identify them by; an
       index key would only restate the reconciliation Svelte already does. -->
  <!-- eslint-disable svelte/require-each-key -->
  {#each paragraphs as tokens}
    {#if tokens.length === 0}
      <br />
    {:else}
      <p>
        {#each tokens as token}
          {#if token.kind === "text"}{token.text}{:else if token.kind === "link"}<a
              href={token.href}
              target="_blank"
              rel="noopener noreferrer">{token.text}</a
            >{:else}<Link
              href={`/watch?v=${youtubeId}&time=${token.seconds}`}
              title={`Play from ${token.text}`}>{token.text}</Link
            >{/if}
        {/each}
      </p>
    {/if}
  {/each}
</div>

<style>
  .description {
    margin-bottom: 1.5rem;
    line-height: 1.625;
  }

  .description p {
    margin: 0;
  }
</style>
