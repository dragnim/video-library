<script lang="ts">
  import { rosters } from "../../lib/state/rosters.svelte";
  import { loadSummaries, summaries } from "../../lib/data/summaries.svelte";
  import type { DyalogEvent } from "../../lib/api/types";
  import Link from "../../lib/router/Link.svelte";
  import { eventHref } from "../results/presenters";
  import { formatDateRange } from "../../lib/utils/formatDate";

  loadSummaries();

  // A copy: sorting in place would mutate the roster's own array. By name first,
  // then by type, so events sit alphabetically within their type group.
  const events = $derived(
    [...rosters.events]
      .sort((a, b) => a.fullname.localeCompare(b.fullname))
      .sort((a, b) => a.type.localeCompare(b.type)),
  );

  interface Group {
    type: string;
    items: DyalogEvent[];
  }

  // Runs the sorted list into groups of equal type, so equal types must be adjacent.
  function groupByEventType(items: DyalogEvent[]): Group[] {
    const groups: Group[] = [];

    for (const item of items) {
      const last = groups[groups.length - 1];

      if (last?.type === item.type) last.items.push(item);
      else groups.push({ type: item.type, items: [item] });
    }

    return groups;
  }

  const groups = $derived(groupByEventType(events));
</script>

<svelte:head>
  <title>Events | Dyalog Video Library</title>
</svelte:head>

{#each groups as group (group.type)}
  <section class="list">
    <h2 class="type">{group.type}</h2>

    {#each group.items as event (event.id)}
      {@const summary = summaries.event(event.shortname)}
      {@const when = formatDateRange(
        summary?.from ?? null,
        summary?.to ?? null,
        "short",
      )}
      <article class="row">
        <h3><Link href={eventHref(event.shortname)}>{event.fullname}</Link></h3>

        {#if summary}
          <p class="meta">
            {#if when}<span>{when}</span>{/if}
            <span
              >{summary.talkCount}
              {summary.talkCount === 1 ? "video" : "videos"}</span
            >
          </p>
        {/if}
      </article>
    {/each}
  </section>
{/each}

<style>
  .list {
    display: flex;
    flex-direction: column;
  }

  /* A label, like the Browse line and the featured captions: the text face, the
     same step and weight, the same muted colour. The heading reset hands every
     heading the display face, so this has to say otherwise. */
  :global(#dyalog-video-library) .type {
    padding-top: 1rem;
    font-family: var(--dyalog-video-library-font-text);
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-muted);
  }

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--dyalog-video-library-rule);
  }

  /* Titled as a video card is titled: same step, same weight, and Klavika from
     the heading reset. An event in this list and a video in the grid are the same
     kind of thing to click. */
  :global(#dyalog-video-library) h3 {
    font-size: var(--dyalog-video-library-size-lg);
    font-weight: var(--dyalog-video-library-weight-regular);
  }

  :global(#dyalog-video-library) h3 :global(a) {
    text-decoration: none;
    color: var(--dyalog-video-library-link);
  }

  :global(#dyalog-video-library) h3 :global(a:hover) {
    color: var(--dyalog-video-library-accent);
  }

  /* The label treatment too: it was already the right step and weight, and the
     colour is what it was missing. */
  .meta {
    display: flex;
    gap: 0.5rem;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-muted);
    white-space: nowrap;
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  /* Separates the facts without a character in the markup. */
  .meta span + span::before {
    content: "· ";
  }

  @media (max-width: 640px) {
    .row {
      flex-direction: column;
      gap: 0.125rem;
    }
  }
</style>
