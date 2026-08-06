<script lang="ts">
  import EventRow from "../results/EventRow.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import { loadSummaries, summaries } from "../../lib/data/summaries.svelte";

  loadSummaries();

  // A sorted copy
  const events = $derived(
    [...rosters.events].sort((a, b) => a.fullname.localeCompare(b.fullname)),
  );
</script>

<svelte:head>
  <title>Events | Dyalog Video Library</title>
</svelte:head>

<div class="list">
  {#each events as event (event.shortname)}
    <EventRow {event} summary={summaries.event(event.shortname)} />
  {/each}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
  }
</style>
