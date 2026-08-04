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
</script>

<article class="card">
  <!-- Thumbnail and title are one link, so the grid is one tab stop per card.
       The image is decorative: the title beside it names the destination. -->
  <Link href={`/watch?v=${video.youtubeId}`}>
    <img src={video.thumbnail} alt="" loading="lazy" decoding="async" />
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
    transition:
      box-shadow 120ms ease,
      border-color 120ms ease;
  }

  .card:hover {
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
    border-color: var(--dyalog-video-library-card-hover-border);
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

  img {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: var(--dyalog-video-library-radius)
      var(--dyalog-video-library-radius) 0 0;
  }

  h3 {
    padding: 0.75rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--dyalog-video-library-link);
  }

  .card:hover h3 {
    color: var(--dyalog-video-library-accent);
  }

  .presenters {
    padding: 0 0 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
  }

  .meta {
    padding: 0.5rem 0.75rem;
  }

  .meta p {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
    font-size: 0.875rem;
    font-weight: 700;
  }

  hr {
    border: 0;
    border-top: 1px solid var(--dyalog-video-library-rule);
  }
</style>
