<script lang="ts">
  import EventRow from "../results/EventRow.svelte";
  import { rosters } from "../../lib/state/rosters.svelte";
  import {
    eventSummaries,
    loadEventSummaries,
  } from "../../lib/data/eventSummaries.svelte";

  loadEventSummaries();

  // A copy: sorting in place would mutate the roster's own array.
  const events = $derived(
    [...rosters.events].sort((a, b) => a.fullname.localeCompare(b.fullname)),
  );
</script>

<div class="list">
  {#each events as event (event.shortname)}
    <EventRow {event} summary={eventSummaries.get(event.shortname)} />
  {/each}
</div>

<style>
  .list {
    display: flex;
    flex-direction: column;
  }
</style>
