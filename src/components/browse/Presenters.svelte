<script lang="ts">
  import AlphabetBar from "./AlphabetBar.svelte";
  import PresenterRow from "../results/PresenterRow.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import { loadSummaries, summaries } from "../../lib/data/summaries.svelte";
  import { groupByInitial, letterId } from "../../lib/utils/alphabet";

  loadSummaries();

  // A copy: sorting in place would mutate the roster's own array.
  const presenters = $derived(
    [...rosters.presenters].sort((a, b) => a.name.localeCompare(b.name)),
  );

  const groups = $derived(
    groupByInitial(presenters, (presenter) => presenter.name),
  );
</script>

<svelte:head>
  <title>Presenters | Dyalog Video Library</title>
</svelte:head>

<AlphabetBar present={groups.map((group) => group.letter)} />

{#each groups as group (group.letter)}
  <section class="list">
    <!-- Focused by the bar, so it takes a tabindex; the outline is the global
         :focus-visible rule's to draw. -->
    <h2 class="letter" id={letterId(group.letter)} tabindex="-1">
      {group.letter}
    </h2>

    {#each group.items as presenter (presenter.id)}
      <PresenterRow {presenter} summary={summaries.presenter(presenter.id)} />
    {/each}
  </section>
{/each}

<style>
  .list {
    display: flex;
    flex-direction: column;
  }

  /* Clears the sticky bar when the bar scrolls the heading into view. */
  :global(#dyalog-video-library) .letter {
    scroll-margin-top: 3rem;
    padding-top: 1rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--dyalog-video-library-muted);
  }
</style>
