<script lang="ts">
  // From and to year, as two selects over the library's span. The lists
  // constrain each other, so an inverted range cannot be picked. A view over the
  // URL: each change writes through applyFilters and nothing is held here.
  import { filters } from "../../lib/state/filters.svelte";
  import { applyFilters } from "../../lib/state/searchPanel.svelte";

  /** The year of the oldest talk in the library. */
  const MIN_YEAR = 2008;

  // Read once at import. dvl recomputed it on every render.
  const MAX_YEAR = new Date().getFullYear();

  /** The picker is whole-year, so a `from=2015-06-01` URL reads as 2015. */
  function parseYear(date: string): number | null {
    const year = Number.parseInt(date.slice(0, 4), 10);
    return Number.isNaN(year) ? null : year;
  }

  function span(first: number, last: number): number[] {
    const count = Math.abs(last - first) + 1;
    const step = last < first ? -1 : 1;
    return Array.from({ length: count }, (_, i) => first + i * step);
  }

  /**
   * A year the URL carries from outside the offered span still shows, or the
   * select names a bound the list is not under.
   */
  function withSelected(options: number[], selected: number | null): number[] {
    if (selected === null || options.includes(selected)) return options;
    return [selected, ...options];
  }

  const fromYear = $derived(parseYear(filters.current.from));
  const toYear = $derived(parseYear(filters.current.to));

  const fromOptions = $derived(
    withSelected(
      span(MIN_YEAR, Math.max(toYear ?? MAX_YEAR, MIN_YEAR)),
      fromYear,
    ),
  );
  const toOptions = $derived(
    withSelected(
      span(MAX_YEAR, Math.min(fromYear ?? MIN_YEAR, MAX_YEAR)),
      toYear,
    ),
  );

  const filtered = $derived(fromYear !== null || toYear !== null);

  // Whole years, as the API's dates: the range covers both years entirely.
  const write = (from: number | null, to: number | null) =>
    applyFilters({
      from: from === null ? "" : `${from}-01-01`,
      to: to === null ? "" : `${to}-12-31`,
    });

  const chosen = (value: string) =>
    value === "" ? null : Number.parseInt(value, 10);
</script>

<div class="range">
  <span class="field">
    <label for="video-library-from-year">From</label>
    <select
      id="video-library-from-year"
      value={fromYear ?? ""}
      onchange={(event) => write(chosen(event.currentTarget.value), toYear)}
    >
      <!-- dvl has no such option and sets a value matching none of them, so both
           its selects read blank rather than unbounded. -->
      <option value="">Any</option>
      {#each fromOptions as year (year)}
        <option value={year}>{year}</option>
      {/each}
    </select>
  </span>

  <span class="field">
    <label for="video-library-to-year">To</label>
    <select
      id="video-library-to-year"
      value={toYear ?? ""}
      onchange={(event) => write(fromYear, chosen(event.currentTarget.value))}
    >
      <option value="">Any</option>
      {#each toOptions as year (year)}
        <option value={year}>{year}</option>
      {/each}
    </select>
  </span>

  {#if filtered}
    <button type="button" class="all" onclick={() => write(null, null)}>
      All
    </button>
  {/if}
</div>

<style>
  .range {
    display: flex;
    align-items: end;
    gap: 0.5rem;
  }

  /*
   * Inline, not stacked.
   *
   * The other two columns lost their second line of text when their labels went
   * to the screen reader, and From and To cannot: they say which select is which.
   * Beside their selects instead of above them, all three columns are a heading
   * and one row of controls, and the controls line up across the panel.
   */
  .field {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--dyalog-video-library-size-sm);
  }

  select {
    height: var(--dyalog-video-library-control-height);
    /* Room for the chevron. The browser draws it inside the padding box, so
       without this it sits hard against the border and reads as clipped. */
    padding: 0 1.5rem 0 0.5rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    color: var(--dyalog-video-library-text);
    /* Ours, not the browser's: appearance strips the native one, which sits hard
       against the border and cannot be moved with padding. */
    appearance: none;
    background-color: var(--dyalog-video-library-surface);
    background-image: var(--dyalog-video-library-chevron);
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    background-size: 10px 6px;
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. */
  :global(#dyalog-video-library) .all {
    height: var(--dyalog-video-library-control-height);
    padding: 0 0.75rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-primary);
    font-size: var(--dyalog-video-library-size-sm);
    cursor: pointer;
  }

  @media (max-width: 640px) {
    select,
    .all {
      min-height: 44px;
    }
  }
</style>
