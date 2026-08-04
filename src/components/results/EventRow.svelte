<script lang="ts">
  import type { DyalogEvent } from "../../lib/api/types";
  import type { EventSummary } from "../../lib/data/eventSummary";
  import Link from "../../lib/router/Link.svelte";
  import { formatDateRange } from "../../lib/utils/formatDate";
  import { eventHref, presenterLabels, separator } from "./presenters";

  let {
    event,
    summary,
  }: { event: DyalogEvent; summary: EventSummary | undefined } = $props();

  /** Enough names to give the event a flavour without wrapping to a paragraph. */
  const NAMES_SHOWN = 3;

  const when = $derived(
    formatDateRange(summary?.from ?? null, summary?.to ?? null, "short"),
  );

  const credited = $derived(
    presenterLabels((summary?.presenterIds ?? []).slice(0, NAMES_SHOWN)),
  );
  const uncredited = $derived(
    Math.max(0, (summary?.presenterCount ?? 0) - credited.length),
  );
</script>

<article class="row">
  <div class="identity">
    <h2><Link href={eventHref(event.shortname)}>{event.fullname}</Link></h2>
    {#if event.type}
      <p class="type">{event.type}</p>
    {/if}
  </div>

  <p class="meta">
    {#if when}<span>{when}</span>{/if}
    {#if summary}
      <span
        >{summary.talkCount}
        {summary.talkCount === 1 ? "video" : "videos"}</span
      >
    {/if}
  </p>

  {#if credited.length > 0}
    <p class="presenters">
      {#each credited as presenter, index (presenter.id)}
        {presenter.label}{separator(index, credited.length)}
      {/each}{#if uncredited > 0}<span class="more">
          &plus;{uncredited} more</span
        >{/if}
    </p>
  {/if}
</article>

<style>
  .row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--dyalog-video-library-rule);
  }

  .identity {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  h2 :global(a) {
    text-decoration: none;
    color: var(--dyalog-video-library-link);
  }

  h2 :global(a:hover) {
    color: var(--dyalog-video-library-accent);
  }

  .type {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--dyalog-video-library-muted);
  }

  .meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 700;
  }

  /* Separates the facts without a character in the markup. */
  .meta span + span::before {
    content: "· ";
  }

  .presenters {
    font-size: 0.875rem;
    color: var(--dyalog-video-library-muted);
  }

  .more {
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    h2 {
      font-size: 1.25rem;
    }

    .identity {
      gap: 0.125rem;
    }
  }
</style>
