<script lang="ts">
  // The filter row: what is being browsed, the selection dropdowns that narrow results, and the controls over how it is arranged.
  // Dropdowns write the URL through setFilters.
  import ListControls from "./ListControls.svelte";
  import { back, location } from "../../lib/router/location.svelte";
  import { filters } from "../../lib/state/filters.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import { BROWSE_SORTS, isSearch } from "../../lib/utils/browseFilters";

  interface Props {
    /** Null until the first page lands: a loading list has no total. */
    total?: number | null;
    /** The sorts this surface offers, for ListControls. */
    sorts?: string[];
  }

  let { total = null, sorts = BROWSE_SORTS }: Props = $props();

  const searching = $derived(isSearch(filters.current));

  /**
   * Counted from the roster the Presenters tab lists, so the two agree, and left
   * off entirely until it lands rather than announcing "from 0 presenters".
   * Gated on the count rather than the roster's status: events and presenters
   * settle separately, so a failed event roster still leaves presenters usable.
   */
  const presenterCount = $derived(rosters.presenters.length);

  const heading = $derived.by(() => {
    if (searching) {
      if (total === null) return "Searching...";
      return `Showing ${total} result${total === 1 ? "" : "s"}`;
    }

    if (total === null) return "Browse all videos";

    const videos = `Browse all ${total} video${total === 1 ? "" : "s"}`;
    if (presenterCount === 0) return videos;

    return `${videos} from ${presenterCount} presenter${
      presenterCount === 1 ? "" : "s"
    }`;
  });

  // Only show back if we came from a search or link within the app.
  // A URL that takes us directly to a watch or results page has nowhere to go back to.
  const showBack = $derived(searching && location.depth > 0);
</script>

<div class="bar">
  {#if showBack}
    <button type="button" class="back" onclick={back}>
      <span aria-hidden="true">&larr;</span> Back
    </button>
  {/if}

  <span class="heading">{heading}</span>

  <ListControls {sorts} />
</div>

<style>
  /* Sticky against the search chrome above it. The Elementor page has its own
     sticky header, so this is the first thing to check on the staging page. */
  .bar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0;
    margin-bottom: 0.875rem;
    border-bottom: 1px solid var(--dyalog-video-library-rule);
    background: var(--dyalog-video-library-page-bg);
  }

  /* Takes the free space, so the controls stay right and the heading stays
     beside the Back button when there is one. */
  /* Sized like the date on a card but coloured as a label, which is what it is
     — the same --muted the FEATURED and FROM THIS EVENT labels use. A span
     rather than a heading, so nothing in the heading reset reaches it. */
  .heading {
    margin-right: auto;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-muted);
    white-space: nowrap;
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. */
  :global(#dyalog-video-library) .back {
    padding: 0.25rem 0.625rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-primary);
    font-size: var(--dyalog-video-library-size-base);
    font-weight: var(--dyalog-video-library-weight-bold);
    white-space: nowrap;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    :global(#dyalog-video-library) .back {
      min-height: 44px;
    }
  }
</style>
