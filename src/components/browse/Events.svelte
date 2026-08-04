<script lang="ts">
  // Show events cards
  import { rosters } from "../../lib/state/rosters.svelte";
  let events = $derived(rosters.events);
</script>

<h1>Eventts</h1>
{#each events as event (event.shortname)}
  <p>{event.fullname}</p>
{/each}
