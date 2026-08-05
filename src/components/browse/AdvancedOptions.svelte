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

  <div class="column grow">
    <h3>Filter by Presenter</h3>
    <PresenterPicker />
  </div>

  <div class="column">
    <h3>Filter by Event</h3>
    <span class="field">
      <label for="video-library-event">Event</label>
      <!-- dvl's "Any" string sentinel is not ported: it had to be mapped back to
           "" wherever the value was read. The option carries "" itself. -->
      <select
        id="video-library-event"
        value={filters.current.event}
        onchange={(event) => applyFilters({ event: event.currentTarget.value })}
      >
        <option value="">Any</option>
        {#each events as event (event.id)}
          <option value={event.shortname}>{event.fullname}</option>
        {/each}
      </select>
    </span>
  </div>
</div>

<style>
  .panel {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.75rem 0 1rem;
  }

  /* Heading, then label, then control in every column, so the controls line up
     across the row and the presenter tokens hang below without moving them.
     A select is as wide as its longest option, and these two keep that width:
     truncating an event name loses the thing the user is choosing by. */
  .column {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.375rem;
    flex: 0 0 auto;
  }

  /* The type-ahead takes the rest, and `min-width: 0` makes it the column that
     yields when the band runs out of room. */
  .grow {
    flex: 1;
    min-width: 0;
    align-items: stretch;
  }

  /* The mount id, since the kit styles headings and would otherwise take this
     one to its own dark colour against the navy band. */
  :global(#dyalog-video-library) h3 {
    margin: 0;
    color: var(--dyalog-video-library-on-primary);
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }

  select {
    height: var(--dyalog-video-library-control-height);
    padding: 0 0.5rem;
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
