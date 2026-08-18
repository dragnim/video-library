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
  <!-- The name and where they spoke, as one block: the dates and the count go out
       to the right, where an event row puts them. -->
  <div class="who">
    <h3><Link href={presenterHref(presenter.id)}>{presenter.name}</Link></h3>

    {#if shown.length > 0}
      <p class="events">
        {#each shown as event, index (event.slug)}
          {event.label}{separator(index, shown.length)}
        {/each}{#if unshown > 0}<span class="more">
            &plus;{unshown} more</span
          >{/if}
      </p>
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
</article>

<style>
  /* The same shape as an event row: what you click on the left, the facts about
     it on the right, aligned on the first line's baseline. */
  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--dyalog-video-library-rule);
  }

  .who {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  /* Titled as a video card is titled, as an event is on the events page. */
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

  /* The label treatment, and nowrap so the dates and the count stay on one line
     out at the right rather than folding. */
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

  .events {
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-muted);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  .more {
    white-space: nowrap;
  }

  /* One column, so the dates sit under the events rather than squeezing them. */
  @media (max-width: 640px) {
    .row {
      flex-direction: column;
      gap: 0.125rem;
    }
  }
</style>
