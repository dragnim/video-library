<script lang="ts">
  // The filter row: what is being browsed, the selection dropdowns that narrow results, and the controls over how it is arranged.
  // Dropdowns write the URL through setFilters.
  import ListControls from "./ListControls.svelte";
  import { BROWSE_SORTS } from "../../lib/utils/browseFilters";

  interface Props {
    /** Null until the first page lands: a loading list has no total. */
    total?: number | null;
    /** The sorts this surface offers, for ListControls. */
    sorts?: string[];
  }

  let { total = null, sorts = BROWSE_SORTS }: Props = $props();

  const heading = $derived(
    total === null ? "Browse all" : `Browse all ${total}`,
  );
</script>

<div class="bar">
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
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0;
    margin-bottom: 0.875rem;
    border-bottom: 1px solid var(--dyalog-video-library-rule);
    background: var(--dyalog-video-library-page-bg);
  }

  .heading {
    font-size: 0.9375rem;
    font-weight: 700;
    white-space: nowrap;
  }
</style>
