<script lang="ts">
  // Sort, and the grid/list toggle. Its own component because /search renders
  // the same pair with a Per Page control beside it.
  import { assetsPrefix } from "../../lib/env";
  import { filters, setFilters } from "../../lib/state/filters.svelte";
  import { layout } from "../../lib/state/layout.svelte";

  const SORTS = [
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
  ];

  // The one thing that cannot live in the stylesheet: the prefix is a runtime
  // value, and the mask below takes its colour from a token either way.
  const icon = (file: string) => `url(${assetsPrefix}/${file})`;
</script>

<span class="controls">
  <span class="toggle">
    <button
      type="button"
      class="icon"
      aria-label="View results as list"
      aria-pressed={!layout.isGrid}
      onclick={() => (layout.isGrid = false)}
      style:--icon={icon("icon_video-list_01.svg")}
    ></button>

    <label class="switch">
      <input type="checkbox" bind:checked={layout.isGrid} />
      <span class="track"></span>
      <span class="sr-only">Show results as a grid</span>
    </label>

    <button
      type="button"
      class="icon"
      aria-label="View results as grid"
      aria-pressed={layout.isGrid}
      onclick={() => (layout.isGrid = true)}
      style:--icon={icon("icon_video-grid_02.svg")}
    ></button>
  </span>

  <span class="sort">
    <label for="video-library-sort">Sort:</label>
    <!-- No `form` attribute: sort writes through setFilters, so it needs no
         form to submit, let alone one in another component. -->
    <select
      id="video-library-sort"
      value={filters.current.sort}
      onchange={(event) => setFilters({ sort: event.currentTarget.value })}
    >
      {#each SORTS as sort (sort.value)}
        <option value={sort.value}>{sort.label}</option>
      {/each}
    </select>
  </span>
</span>

<style>
  .controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  /* One SVG per arrangement, tinted by the mask rather than shipped twice. */
  .icon {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background-color: var(--dyalog-video-library-muted);
    mask-image: var(--icon);
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    cursor: pointer;
  }

  .icon[aria-pressed="true"] {
    background-color: var(--dyalog-video-library-secondary);
  }

  .switch {
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .track {
    position: relative;
    display: block;
    width: 2rem;
    height: 1.25rem;
    border-radius: 999px;
    background: var(--dyalog-video-library-primary);
  }

  .track::after {
    content: "";
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    background: var(--dyalog-video-library-on-primary);
    transition: transform 120ms ease;
  }

  .switch input:checked + .track::after {
    transform: translateX(0.75rem);
  }

  /* The checkbox is the control; the track is what it looks like. */
  .sr-only,
  .switch input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .switch input:focus-visible + .track {
    outline: 2px solid var(--dyalog-video-library-secondary);
    outline-offset: 2px;
  }

  .sort {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
  }

  select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    background: #ffffff;
    color: inherit;
  }

  @media (max-width: 640px) {
    .icon,
    select {
      min-height: 44px;
    }

    .icon {
      width: 44px;
      mask-size: 24px;
    }
  }
</style>
