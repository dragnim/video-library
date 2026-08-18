<script lang="ts">
  // Jumps to a letter's section of the presenter list.
  import { LETTERS, letterId, OTHER } from "../../lib/utils/alphabet";

  interface Props {
    /** The letters the list actually has sections for. */
    present: string[];
  }

  let { present }: Props = $props();

  const has = $derived(new Set(present));
  const letters = $derived(has.has(OTHER) ? [...LETTERS, OTHER] : LETTERS);

  /**
   * The href alone would scroll, but it also pushes a history entry per jump,
   * so Back would make users go through every letter tried so far.
   */
  function jump(event: MouseEvent, letter: string): void {
    const section = document.getElementById(letterId(letter));
    if (!section) return;

    event.preventDefault();
    section.scrollIntoView();
    // Keyboard and screen reader users carry on from the heading they asked for.
    section.focus({ preventScroll: true });
  }
</script>

<nav class="bar" aria-label="Jump to letter">
  {#each letters as letter (letter)}
    {#if has.has(letter)}
      <a href="#{letterId(letter)}" onclick={(event) => jump(event, letter)}>
        {letter}
      </a>
    {:else}
      <span aria-hidden="true">{letter}</span>
    {/if}
  {/each}
</nav>

<style>
  /* Sticky against the search chrome above it, as BrowseBar is on the other
     surfaces. */
  .bar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.125rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--dyalog-video-library-rule);
    background: var(--dyalog-video-library-page-bg);
  }

  a,
  span {
    padding: 0.125rem 0.375rem;
    border-radius: var(--dyalog-video-library-radius);
    font-size: var(--dyalog-video-library-size-base);
    font-weight: var(--dyalog-video-library-weight-bold);
    line-height: 1.4;
  }

  /*
   * The mount id on both states.
   *
   * The kit styles `a` and `a:hover` at 0,1,1, and Svelte writes its scoping
   * class as `:where(.hash)` — which adds no specificity, so a bare `a:hover`
   * here tied with the kit and lost on source order. Hovering a letter took the
   * kit's own link colour rather than ours.
   */
  :global(#dyalog-video-library) .bar a {
    color: var(--dyalog-video-library-link);
    text-decoration: none;
  }

  :global(#dyalog-video-library) .bar a:hover {
    color: var(--dyalog-video-library-text);
    background: var(--dyalog-video-library-secondary);
  }

  span {
    color: var(--dyalog-video-library-muted);
  }

  @media (max-width: 640px) {
    a,
    span {
      padding: 0.25rem 0.5rem;
    }
  }
</style>
