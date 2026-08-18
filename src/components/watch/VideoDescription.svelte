<script lang="ts">
  // The description as the author typed it, with the addresses and chapter
  // marks in it made clickable. Parsing is in utils/videoDescription.ts.
  import Link from "../../lib/router/Link.svelte";
  import {
    descriptionBlocks,
    type DescriptionToken,
  } from "../../lib/utils/videoDescription";

  let {
    description,
    youtubeId,
  }: {
    description: string;
    /** Which video a chapter mark seeks within. */
    youtubeId: string;
  } = $props();

  const blocks = $derived(descriptionBlocks(description));
</script>

<div class="description">
  <!-- Unkeyed, every block. A key has to identify the item, and blocks are
       re-derived from the description with nothing to identify them by; an
       index key would only restate the reconciliation Svelte already does. -->
  <!-- eslint-disable svelte/require-each-key -->
  {#snippet line(tokens: DescriptionToken[])}
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
  {/snippet}

  {#each blocks as block}
    {#if block.kind === "break"}
      <br />
    {:else if block.kind === "list"}
      <ul>
        {#each block.items as item}
          <li>{@render line(item)}</li>
        {/each}
      </ul>
    {:else}
      <p>{@render line(block.tokens)}</p>
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

  /*
   * The id, because app.css zeroes list padding inside the mount at 1,0,0 and a
   * scoped rule here would lose to it and indent nothing.
   *
   * The marker is the list's now rather than a character in the text, so it hangs
   * outside the text block and wrapped lines line up with the first.
   */
  :global(#dyalog-video-library) .description ul {
    margin: 0.25rem 0 0.75rem;
    padding-left: 1.25rem;
    list-style: disc;
  }

  :global(#dyalog-video-library) .description li {
    margin-bottom: 0.25rem;
  }
</style>
