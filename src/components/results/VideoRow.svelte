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

  let { video }: { video: Video } = $props();

  const presenters = $derived(presenterLabels(video.presenterIds));
  const watch = $derived(`/watch?v=${video.youtubeId}`);
</script>

<article class="row">
  <!-- Two links rather than one: the text column is tall enough that wrapping
       the description in the link would be worse than a second tab stop. -->
  <Link href={watch}>
    <img src={video.thumbnail} alt="" loading="lazy" decoding="async" />
  </Link>

  <div class="body">
    <h2><Link href={watch}>{video.title}</Link></h2>

    {#if video.description}
      <p class="description">{video.description}</p>
    {/if}

    {#if presenters.length > 0}
      <p class="presenters">
        {#each presenters as presenter, index (presenter.id)}
          <Link href={presenterHref(presenter.id)}>{presenter.label}</Link
          >{separator(index, presenters.length)}
        {/each}
      </p>
    {/if}

    <hr />

    <p class="meta">
      <span>{formatDate(video.presentedAt, "long")}</span>
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
  .row {
    display: grid;
    grid-template-columns: 11fr 20fr;
    background: var(--dyalog-video-library-surface);
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    box-shadow: var(--dyalog-video-library-card-shadow);
    transition: var(--dyalog-video-library-card-transition);
  }

  .row:hover {
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
  }

  /* The thumbnail link, as a direct child. */
  .row > :global(a) {
    display: flex;
  }

  img {
    width: 100%;
    height: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--dyalog-video-library-radius) 0 0
      var(--dyalog-video-library-radius);
  }

  .body {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    padding: 0.75rem 2rem;
  }

  /* Deliberately the same as the grid card's title: same step, same weight. A
     row and a card are the same video in two layouts. */
  :global(#dyalog-video-library) h2 {
    font-size: var(--dyalog-video-library-size-lg);
    font-weight: var(--dyalog-video-library-weight-regular);
  }

  :global(#dyalog-video-library) h2 :global(a) {
    text-decoration: none;
    color: var(--dyalog-video-library-link);
  }

  :global(#dyalog-video-library) h2 :global(a:hover) {
    color: var(--dyalog-video-library-accent);
  }

  .description {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    overflow: hidden;
    margin: 0.75rem 0;
    white-space: pre-wrap;
    color: var(--dyalog-video-library-muted);
  }

  .presenters {
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  /* .meta carries 0.5rem of its own below, so the bottom is trimmed to keep the
     rule sitting evenly between the credits and the date. */
  hr {
    margin: 0.75rem 0 0.25rem;
    border: 0;
    border-top: 1px solid var(--dyalog-video-library-rule);
  }

  /* The date and the "in" before the event. The event itself is a link and
     the theme colours those with !important, so it keeps its own colour. */
  .meta {
    color: var(--dyalog-video-library-text-strong);
    display: flex;
    justify-content: space-between;
    margin: 0.5rem 0;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  @media (max-width: 640px) {
    .row {
      grid-template-columns: 1fr;
    }

    img {
      border-radius: var(--dyalog-video-library-radius)
        var(--dyalog-video-library-radius) 0 0;
    }

    .body {
      padding: 0.75rem 1.25rem;
    }
  }
</style>
