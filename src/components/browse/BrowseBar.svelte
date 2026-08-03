<script lang="ts">
  // The filter row: what is being browsed, the chips that narrow it, and the
  // controls over how it is arranged. Every chip writes the URL through
  // setFilters, which is what keeps the chips and the advanced-search panel
  // showing one state rather than two copies of it.
  import { filters, setFilters } from "../../lib/state/filters.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import Chip from "./Chip.svelte";
  import ChipMenu from "./ChipMenu.svelte";
  import ListControls from "./ListControls.svelte";

  interface Props {
    /** Null until the first page lands: a loading list has no total. */
    total?: number | null;
  }

  let { total = null }: Props = $props();

  /** What the type-ahead offers at once. */
  const MATCHES = 8;

  type MenuName = "event" | "presenter";

  let openMenu = $state<MenuName | null>(null);
  let presenterQuery = $state("");

  const current = $derived(filters.current);
  const heading = $derived(
    total === null ? "Browse all" : `Browse all ${total}`,
  );

  const selectedEvent = $derived(rosters.event(current.event));

  /**
   * Named while the roster is loading, `#412` once it is loaded and the id
   * genuinely is not in it. Unnamed either way, the chip stays removable: a
   * filter the user cannot read is one they especially need to clear.
   */
  const selectedPresenters = $derived(
    current.presenterIds.map((id) => ({
      id,
      name:
        rosters.presenterName(id) ??
        (rosters.status === "loading" ? "" : `#${id}`),
    })),
  );

  const presenterMatches = $derived.by(() => {
    const query = presenterQuery.trim().toLowerCase();
    const matching =
      query === ""
        ? rosters.presenters
        : rosters.presenters.filter((presenter) =>
            presenter.name.toLowerCase().includes(query),
          );

    return matching.slice(0, MATCHES);
  });

  function toggleMenu(name: MenuName): void {
    openMenu = openMenu === name ? null : name;
    presenterQuery = "";
  }

  function closeMenu(): void {
    openMenu = null;
    presenterQuery = "";
  }

  function chooseEvent(shortname: string): void {
    setFilters({ event: shortname });
    closeMenu();
  }

  function choosePresenter(id: number): void {
    // Deduped, so choosing a presenter twice does not put the id in the URL
    // twice and leave two chips that remove each other.
    setFilters({ presenterIds: [...new Set([...current.presenterIds, id])] });
    closeMenu();
  }

  function removePresenter(id: number): void {
    setFilters({
      presenterIds: current.presenterIds.filter((each) => each !== id),
    });
  }

  function removeLabel(name: string): string {
    return name === "" ? "Remove filter" : `Remove ${name} filter`;
  }
</script>

<div class="bar">
  <span class="heading">{heading}</span>

  <span class="chips">
    <Chip
      aria-pressed={current.sort === "newest"}
      onclick={() => setFilters({ sort: "newest" })}
    >
      Newest
    </Chip>

    <ChipMenu
      label="Event"
      open={openMenu === "event"}
      onToggle={() => toggleMenu("event")}
      onClose={closeMenu}
    >
      <ul>
        {#each rosters.events as event (event.id)}
          <li>
            <button type="button" onclick={() => chooseEvent(event.shortname)}>
              {event.fullname}
            </button>
          </li>
        {/each}
      </ul>
    </ChipMenu>

    <ChipMenu
      label="Presenter"
      open={openMenu === "presenter"}
      onToggle={() => toggleMenu("presenter")}
      onClose={closeMenu}
    >
      <input
        type="text"
        bind:value={presenterQuery}
        placeholder="Filter presenters…"
        aria-label="Filter presenters"
      />
      <ul>
        {#each presenterMatches as presenter (presenter.id)}
          <li>
            <button type="button" onclick={() => choosePresenter(presenter.id)}>
              {presenter.name}
            </button>
          </li>
        {/each}
      </ul>
    </ChipMenu>

    {#if selectedEvent}
      <!-- The whole chip removes the filter, rather than a glyph inside it too
           small to be the 44px target the chip already is. -->
      <Chip
        active
        aria-label={removeLabel(selectedEvent.fullname)}
        onclick={() => setFilters({ event: "" })}
      >
        {selectedEvent.fullname}<span aria-hidden="true">×</span>
      </Chip>
    {/if}

    {#each selectedPresenters as presenter (presenter.id)}
      <Chip
        active
        aria-label={removeLabel(presenter.name)}
        onclick={() => removePresenter(presenter.id)}
      >
        {presenter.name}<span aria-hidden="true">×</span>
      </Chip>
    {/each}
  </span>

  <ListControls />
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

  .heading {
    font-size: 0.9375rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .chips {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    min-width: 0;
  }

  input {
    width: 100%;
    margin-bottom: 0.375rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    font-size: 0.8125rem;
  }

  li button {
    display: block;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 0;
    background: none;
    text-align: left;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  li button:hover {
    background: var(--dyalog-video-library-divider-light);
  }

  @media (max-width: 640px) {
    li button {
      min-height: 44px;
    }
  }
</style>
