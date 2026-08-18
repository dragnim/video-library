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
      <!-- The heading above says what this is. The label stays for a screen
           reader, which reads a control by its label and not by a nearby
           heading. -->
      <label class="sr-only" for="video-library-event">Event</label>
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
  /*
   * All the space above, none below.
   *
   * The space below the controls is not this panel's to give: 10px belongs to the
   * search row's own bottom padding and 16px to the tab strip's top padding, and
   * the presenter column's reserved chip row adds 28px inside the panel. So
   * measuring from the bottom of the control row there is about 54px below it and
   * this is the only lever above it.
   *
   * 40px rather than the 54px that would balance exactly: matching it outright
   * makes the band noticeably taller, and most of the difference is a row that
   * is usually empty.
   */
  .panel {
    display: flex;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 2.5rem 0 0;
  }

  /* Heading, then label, then control in every column, so the controls line up
     across the row and the presenter tokens hang below without moving them.
     A select is as wide as its longest option, and these two keep that width:
     truncating an event name loses the thing the user is choosing by. */
  .column {
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 0.5rem;
    flex: 0 0 auto;
  }

  /* The type-ahead takes the rest, and `min-width: 0` makes it the column that
     yields when the band runs out of room. */
  .grow {
    flex: 1;
    min-width: 0;
    align-items: stretch;
  }

  /*
   * The mount id, since the kit styles headings and would otherwise take this
   * one to its own dark colour against the navy band.
   *
   * The text face and the same step as the tabs and the From and To beneath it:
   * these are labels for the controls in their column, and they sit among them
   * rather than announcing a section of the page. The heading reset hands every
   * heading the display face, so this has to say otherwise.
   */
  :global(#dyalog-video-library) h3 {
    margin: 0;
    color: var(--dyalog-video-library-on-primary);
    font-family: var(--dyalog-video-library-font-text);
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-medium);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: var(--dyalog-video-library-size-sm);
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
