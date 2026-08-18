<script lang="ts">
  import type { Presenter } from "../../lib/api/types";
  import type { PresenterSummary } from "../../lib/data/presenterSummary";
  import Link from "../../lib/router/Link.svelte";
  import { formatDateRange } from "../../lib/utils/formatDate";
  import { eventLabels, presenterHref, separator } from "./presenters";

  let {
    presenter,
    summary,
  }: { presenter: Presenter; summary: PresenterSummary | undefined } = $props();

  /** Enough events to place the presenter without wrapping to a paragraph. */
  const EVENTS_SHOWN = 3;

  const when = $derived(
    formatDateRange(summary?.from ?? null, summary?.to ?? null, "short"),
  );

  const shown = $derived(
    eventLabels((summary?.eventSlugs ?? []).slice(0, EVENTS_SHOWN)),
  );
  const unshown = $derived(
    Math.max(0, (summary?.eventCount ?? 0) - shown.length),
  );
</script>

<article class="row">
  <h3><Link href={presenterHref(presenter.id)}>{presenter.name}</Link></h3>

  <p class="meta">
    {#if when}<span>{when}</span>{/if}
    {#if summary}
      <span
        >{summary.talkCount}
        {summary.talkCount === 1 ? "video" : "videos"}</span
      >
    {/if}
  </p>

  {#if shown.length > 0}
    <p class="events">
      {#each shown as event, index (event.slug)}
        {event.label}{separator(index, shown.length)}
      {/each}{#if unshown > 0}<span class="more">
          &plus;{unshown} more</span
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

  :global(#dyalog-video-library) h3 {
    font-size: var(--dyalog-video-library-size-xl);
  }

  :global(#dyalog-video-library) h3 :global(a) {
    text-decoration: none;
    color: var(--dyalog-video-library-link);
  }

  :global(#dyalog-video-library) h3 :global(a:hover) {
    color: var(--dyalog-video-library-accent);
  }

  .meta {
    display: flex;
    gap: 0.5rem;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  /* Separates the facts without a character in the markup. */
  .meta span + span::before {
    content: "· ";
  }

  .events {
    font-size: var(--dyalog-video-library-size-sm);
    color: var(--dyalog-video-library-muted);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  .more {
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    :global(#dyalog-video-library) h3 {
      font-size: var(--dyalog-video-library-size-lg);
    }
  }
</style>
