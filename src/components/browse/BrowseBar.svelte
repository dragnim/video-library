<script lang="ts">
  // The filter row: what is being browsed, the selection dropdowns that narrow results, and the controls over how it is arranged.
  // Dropdowns write the URL through setFilters.
  import ListControls from "./ListControls.svelte";
  import { back, location } from "../../lib/router/location.svelte";
  import { filters } from "../../lib/state/filters.svelte";
  import { BROWSE_SORTS, isSearch } from "../../lib/utils/browseFilters";

  interface Props {
    /** Null until the first page lands: a loading list has no total. */
    total?: number | null;
    /** The sorts this surface offers, for ListControls. */
    sorts?: string[];
  }

  let { total = null, sorts = BROWSE_SORTS }: Props = $props();

  const searching = $derived(isSearch(filters.current));

  const heading = $derived.by(() => {
    if (!searching)
      return total === null ? "Browse all" : `Browse all ${total}`;
    if (total === null) return "Searching...";
    return `Showing ${total} result${total === 1 ? "" : "s"}`;
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
  .heading {
    margin-right: auto;
    font-size: 0.9375rem;
    font-weight: 700;
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
    font-size: 0.9375rem;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    :global(#dyalog-video-library) .back {
      min-height: 44px;
    }
  }
</style>
