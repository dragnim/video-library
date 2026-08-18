<script lang="ts">
  import type { Video } from "../../lib/api/types";
  import Link from "../../lib/router/Link.svelte";
  import { formatDate } from "../../lib/utils/formatDate";
  import {
    eventHref,
    presenterHref,
    presenterLabels,
    separator,
  } from "./presenters";

  interface Props {
    video: Video;
    /** Says what the card is, for the one in the featured strip. Grid cards
        pass nothing, so nothing renders. */
    label?: string;
    /** Grows to fill the height it is given, spending the difference on the
        thumbnail. For a card in a column that has to end level with something
        beside it; a grid card sizes itself. */
    fill?: boolean;
  }

  let { video, label = "", fill = false }: Props = $props();

  const presenters = $derived(presenterLabels(video.presenterIds));
</script>

<article class={["card", fill && "fill"]}>
  <!-- Thumbnail and title are one link, so the grid is one tab stop per card.
       The image is decorative: the title beside it names the destination. -->
  <Link href={`/watch?v=${video.youtubeId}`}>
    <img src={video.thumbnail} alt="" loading="lazy" decoding="async" />
    {#if label !== ""}
      <span class="video-library-label">{label}</span>
    {/if}
    <h3>{video.title}</h3>
  </Link>

  {#if presenters.length > 0}
    <p class="presenters">
      {#each presenters as presenter, index (presenter.id)}
        <Link href={presenterHref(presenter.id)}>{presenter.label}</Link
        >{separator(index, presenters.length)}
      {/each}
    </p>
  {/if}

  <div class="meta">
    <hr />
    <p>
      <span>{formatDate(video.presentedAt, "short")}</span>
      {#if video.eventSlug}
        <span>
          in <Link href={eventHref(video.eventSlug)}
            >{video.event || video.eventSlug}</Link
          >
        </span>
      {/if}
    </p>
  </div>
</article>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background: var(--dyalog-video-library-surface);
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    box-shadow: var(--dyalog-video-library-card-shadow);
    transition: var(--dyalog-video-library-card-transition);
  }

  .card:hover {
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
  }

  /* The title link, as a direct child. A class passed to Link would not carry
     this component's scoping hash. */
  .card > :global(a) {
    display: flex;
    flex: 1;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
  }

  /*
   * Filling, for a card that has to end level with a neighbour.
   *
   * The article grows, the link inside it already does, and the thumbnail takes
   * the remainder — aspect-ratio has to give way or it would keep dictating the
   * height and the slack would pool under the meta row instead.
   */
  .card.fill {
    flex: 1;
  }

  .card.fill img {
    flex: 1;
    min-height: 0;
    aspect-ratio: auto;
  }

  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--dyalog-video-library-radius)
      var(--dyalog-video-library-radius) 0 0;
  }

  .video-library-label {
    padding: 0.75rem 0.75rem 0;
  }

  /* With a label above it the title does not need its own top padding too. */
  :global(#dyalog-video-library) .video-library-label + h3 {
    padding-top: 0.25rem;
  }

  /* Bottom trimmed: the credit line below reads as belonging to the title. */
  /*
   * Clamped and reserved.
   *
   * Clamped so one long title cannot make its card taller than the rest of the
   * row, and reserved to the same two lines so a one-line title does not make a
   * shorter card either. Every card in a grid then agrees without the grid
   * having to stretch anything.
   */
  :global(#dyalog-video-library) h3 {
    padding: 0.75rem 0.75rem 0.25rem;
    min-height: calc(
      var(--dyalog-video-library-title-lines) *
        var(--dyalog-video-library-heading-line-height) * 1em + 1rem
    );
    font-size: var(--dyalog-video-library-size-lg);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-link);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--dyalog-video-library-title-lines);
    line-clamp: var(--dyalog-video-library-title-lines);
    overflow: hidden;
    overflow-wrap: anywhere;
  }

  :global(#dyalog-video-library) .card:hover h3 {
    color: var(--dyalog-video-library-accent);
  }

  .presenters {
    padding: 0 0 0 0.75rem;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  .meta {
    padding: 0.5rem 0.75rem;
  }

  /* The date and the "in" before the event, treated as the labels elsewhere are.
     The event itself is a link and the theme colours those with !important, so
     it keeps its own colour. */
  .meta p {
    color: var(--dyalog-video-library-muted);
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  hr {
    border: 0;
    border-top: 1px solid var(--dyalog-video-library-rule);
  }
</style>
