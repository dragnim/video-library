<script lang="ts">
  import PresenterRow from "../results/PresenterRow.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import { loadSummaries, summaries } from "../../lib/data/summaries.svelte";

  loadSummaries();

  // A copy: sorting in place would mutate the roster's own array.
  const presenters = $derived(
    [...rosters.presenters].sort((a, b) => a.name.localeCompare(b.name)),
  );
</script>

<svelte:head>
  <title>Presenters | Dyalog Video Library</title>
</svelte:head>

<div class="list">
  {#each presenters as presenter (presenter.id)}
    <PresenterRow {presenter} summary={summaries.presenter(presenter.id)} />
  {/each}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
  }
</style>
