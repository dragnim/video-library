<script lang="ts">
  // A type-ahead over the presenter roster, and a removable token per presenter
  // already filtered on. The URL carries ids; the roster is where the names are.
  import type { Attachment } from "svelte/attachments";
  import { filters } from "../../lib/state/filters.svelte";
  import { applyFilters } from "../../lib/state/searchPanel.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";

  /** What the type-ahead offers at once. */
  const MATCHES = 8;

  const LIST_ID = "video-library-presenter-matches";

  let query = $state("");
  let open = $state(false);
  let activeIndex = $state(0);
  let input = $state<HTMLInputElement>();

  const current = $derived(filters.current);

  /**
   * Named while the roster is loading, `#412` once it is loaded and the id
   * genuinely is not in it. Unnamed either way, the token stays removable: a
   * filter the user cannot read is one they especially need to clear.
   */
  const selected = $derived(
    current.presenterIds.map((id) => ({
      id,
      name:
        rosters.presenterName(id) ??
        (rosters.status === "loading" ? "" : `#${id}`),
    })),
  );

  const matches = $derived.by(() => {
    const trimmed = query.trim().toLowerCase();
    const matching =
      trimmed === ""
        ? rosters.presenters
        : rosters.presenters.filter((presenter) =>
            presenter.name.toLowerCase().includes(trimmed),
          );

    return matching.slice(0, MATCHES);
  });

  const active = $derived(matches[activeIndex]);

  function choose(id: number): void {
    // Deduped by id, so choosing a presenter twice does not put the id in the
    // URL twice and leave two tokens that remove each other. dvl dedupes by
    // name, which ties two presenters sharing one together.
    applyFilters({ presenterIds: [...new Set([...current.presenterIds, id])] });
    query = "";
    activeIndex = 0;
  }

  function remove(id: number): void {
    applyFilters({
      presenterIds: current.presenterIds.filter((each) => each !== id),
    });
  }

  function removeLabel(name: string): string {
    return name === "" ? "Remove filter" : `Remove ${name} filter`;
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open = true;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      activeIndex = Math.min(
        Math.max(activeIndex + delta, 0),
        matches.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && open && active) {
      event.preventDefault();
      choose(active.id);
      return;
    }

    if (event.key === "Escape") {
      open = false;
    }
  }

  /**
   * A click elsewhere closes the list. Attached only while it is open, so a
   * closed list listens to nothing. Escape is handled on the input, which is
   * where focus stays.
   */
  const dismiss: Attachment = (element) => {
    function onPointerdown(event: PointerEvent): void {
      if (element.contains(event.target as Node)) return;

      open = false;
    }

    window.addEventListener("pointerdown", onPointerdown);
    return () => window.removeEventListener("pointerdown", onPointerdown);
  };
</script>

<div class="picker" {@attach open && dismiss}>
  <label for="video-library-presenter">Presenter</label>

  <!-- Focus stays on the input and aria-activedescendant names the highlighted
       option, so the options are not themselves focus stops. -->
  <input
    id="video-library-presenter"
    type="text"
    role="combobox"
    autocomplete="off"
    aria-autocomplete="list"
    aria-expanded={open}
    aria-controls={LIST_ID}
    aria-activedescendant={open && active ? `presenter-${active.id}` : ""}
    placeholder="Type a name"
    bind:this={input}
    bind:value={query}
    oninput={() => {
      open = true;
      activeIndex = 0;
    }}
    onfocus={() => (open = true)}
    onkeydown={onKeydown}
  />

  <!-- A div rather than a ul: once the children are options, a list is the wrong
       shape, and a button is not valid content inside an li carrying the role. -->
  <div id={LIST_ID} role="listbox" aria-label="Presenters" hidden={!open}>
    {#each matches as presenter, index (presenter.id)}
      <!-- tabindex="-1": the option is clickable but not a tab stop, since focus
           belongs to the input. -->
      <button
        type="button"
        id="presenter-{presenter.id}"
        role="option"
        tabindex="-1"
        aria-selected={index === activeIndex}
        onclick={() => {
          choose(presenter.id);
          input?.focus();
        }}
      >
        {presenter.name}
      </button>
    {/each}
  </div>

  {#if selected.length !== 0}
    <ul class="chosen">
      {#each selected as presenter (presenter.id)}
        <li>
          <!-- The whole token removes the filter, rather than a glyph inside it
               too small to be the 44px target the token already is. -->
          <button
            type="button"
            class="chip"
            aria-label={removeLabel(presenter.name)}
            onclick={() => remove(presenter.id)}
          >
            {presenter.name}<span aria-hidden="true">×</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .picker {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }

  input {
    height: var(--dyalog-video-library-control-height);
    padding: 0 0.5rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-text);
  }

  [role="listbox"] {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    min-width: 220px;
    width: 100%;
    max-height: 320px;
    overflow-y: auto;
    background: var(--dyalog-video-library-surface);
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
    color: var(--dyalog-video-library-text);
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. `color` is
     stated because the kit's base rule sets it too, and an option that inherits
     nothing is near-white on white. */
  :global(#dyalog-video-library) [role="option"] {
    display: block;
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 0;
    background: none;
    color: inherit;
    text-align: left;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  :global(#dyalog-video-library) [role="option"][aria-selected="true"],
  :global(#dyalog-video-library) [role="option"]:hover {
    background: var(--dyalog-video-library-divider-light);
  }

  .chosen {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. */
  :global(#dyalog-video-library) .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-chip);
    color: var(--dyalog-video-library-text);
    font-size: 0.8125rem;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    input,
    .chip,
    [role="option"] {
      min-height: 44px;
    }
  }
</style>
