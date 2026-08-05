<script lang="ts">
  // The advanced-search panel: date range, presenter and event, in dvl's order.
  // Each column is a view over filters.current and writes through applyFilters.
  import { filters } from "../../lib/state/filters.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import { applyFilters } from "../../lib/state/searchPanel.svelte";
  import PresenterPicker from "./PresenterPicker.svelte";
  import YearRangePicker from "./YearRangePicker.svelte";

  // An event whose slug normalised to "" would render a second option
  // indistinguishable from Any, and select nothing.
  const events = $derived(
    rosters.events.filter((event) => event.shortname !== ""),
  );
</script>

<div class="panel">
  <div class="column">
    <h3>Filter by Date Range</h3>
    <YearRangePicker />
  </div>

  <div class="column">
    <h3>Filter by Presenter</h3>
    <PresenterPicker />
  </div>

  <div class="column">
    <h3>Filter by Event</h3>
    <!-- dvl's "Any" string sentinel is not ported: it had to be mapped back to
         "" wherever the value was read. The option carries "" itself. -->
    <select
      aria-label="Event"
      value={filters.current.event}
      onchange={(event) => applyFilters({ event: event.currentTarget.value })}
    >
      <option value="">Any</option>
      {#each events as event (event.id)}
        <option value={event.shortname}>{event.fullname}</option>
      {/each}
    </select>
  </div>
</div>

<style>
  .panel {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 0 1rem;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
  }

  select {
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-text);
    font-size: 0.8125rem;
  }

  @media (max-width: 640px) {
    .panel {
      flex-direction: column;
      gap: 1rem;
    }

    select {
      min-height: 44px;
    }
  }
</style>
