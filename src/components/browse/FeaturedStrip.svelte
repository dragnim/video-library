<script lang="ts">
  // The editorial strip: a hero, two secondaries and the featured event, four
  // links and four tab stops. What is featured comes from config.js, so the
  // strip resolves its own slots and there is nothing here for a page to wire.
  import type { Video } from "../../lib/api/types";
  import { listEvents } from "../../lib/api/events";
  import { getVideo, listVideos } from "../../lib/api/videos";
  import { featuredConfig, type FeaturedConfig } from "../../lib/config";
  import Link from "../../lib/router/Link.svelte";
  import { DEFAULT_FILTERS } from "../../lib/utils/browseFilters";
  import { isOwnEvent } from "../../lib/utils/ownEvents";
  import VideoCard from "../results/VideoCard.svelte";
  import { formatDate } from "../../lib/utils/formatDate";
  import {
    eventHref,
    presenterHref,
    presenterLabels,
    separator,
  } from "../results/presenters";

  interface Props {
    /** What config.js said, and null to fall back to the newest videos. */
    config?: FeaturedConfig | null;
  }

  let { config = featuredConfig }: Props = $props();

  interface FeaturedEvent {
    slug: string;
    name: string;
    total: number;
  }

  interface Slots {
    hero: Video | null;
    eyebrow: string;
    secondaries: Video[];
    event: FeaturedEvent | null;
  }

  /** Hero plus the one companion card, when nothing is configured. */
  const FALLBACK_SLOTS = 2;

  /**
   * How far down the newest videos to look for one.
   *
   * Only a handful of talks are newer than the last user meeting — eight at the
   * time of writing — but conference and webinar content arrives between
   * meetings, so the window is generous rather than tight. Nothing is rendered
   * if it finds none, rather than falling back to an older event and calling it
   * the last one.
   */
  const NEWEST_WINDOW = 100;

  /** A slot pointing at content that no longer exists renders nothing. */
  const slot = (id: string) => getVideo(id).catch(() => null);

  /**
   * The most recent of Dyalog's own meetings, worked out from the videos.
   *
   * The events API carries `start` and `end`, and both are empty on every live
   * row, so an event has no date of its own to sort by. What it does have is
   * videos, so the newest video belonging to one of our meetings names the
   * meeting. listEvents is already in the five-minute response cache from the
   * roster load, so this costs one request, not two.
   */
  async function loadLastEvent(): Promise<FeaturedEvent | null> {
    const [events, newest] = await Promise.all([
      listEvents().catch(() => []),
      listVideos(
        { ...DEFAULT_FILTERS, sort: "newest" },
        { page: 1, perpage: NEWEST_WINDOW },
      ).catch(() => null),
    ]);

    const ours = new Set(
      events
        .filter((event) => isOwnEvent(event.type))
        .map((event) => event.shortname),
    );

    const video = newest?.items.find(
      (item) => item.eventSlug !== "" && ours.has(item.eventSlug),
    );
    if (!video) return null;

    // One row, for the total: `total` counts the event, where dvl requested six
    // and rendered the number it got back, so an event of 40 read "6 videos".
    const page = await listVideos(
      { ...DEFAULT_FILTERS, event: video.eventSlug },
      { page: 1, perpage: 1 },
    ).catch(() => null);
    if (!page) return null;

    return {
      slug: video.eventSlug,
      name: video.event || video.eventSlug,
      total: page.total,
    };
  }

  async function loadFallback(): Promise<Slots> {
    const page = await listVideos(DEFAULT_FILTERS, {
      page: 1,
      perpage: FALLBACK_SLOTS,
    }).catch(() => null);

    const [hero, ...secondaries] = page?.items ?? [];

    return {
      hero: hero ?? null,
      eyebrow: "",
      secondaries,
      event: await loadLastEvent(),
    };
  }

  async function loadSlots(): Promise<Slots> {
    if (config === null) return loadFallback();

    const { hero, heroEyebrow, secondaryIds } = config;

    // One request per configured slot, none for a slot that is not configured.
    // dvl issued a `perpage=1&pg=1` request for the slots it did not want, to
    // keep its hook count stable between renders.
    const [resolvedHero, secondaries, event] = await Promise.all([
      slot(hero),
      Promise.all(secondaryIds.map(slot)),
      loadLastEvent(),
    ]);

    return {
      hero: resolvedHero,
      eyebrow: heroEyebrow,
      secondaries: secondaries.filter((video) => video !== null),
      event,
    };
  }

  const slots = loadSlots();
</script>

<!--
  The hero, built as a video card is built: the thumbnail and title are one link,
  and the credits and meta sit outside it because they carry links of their own.
-->
{#snippet heroCard(video: Video, eyebrow: string)}
  {@const presenters = presenterLabels(video.presenterIds)}
  <article class="hero-card">
    <Link href={`/watch?v=${video.youtubeId}`}>
      <span class="thumb">
        <img src={video.thumbnail} alt="" loading="lazy" decoding="async" />
      </span>
      {#if eyebrow !== ""}
        <span class="hero-label">{eyebrow}</span>
      {/if}
      <h3 class="title">{video.title}</h3>
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
{/snippet}

{#await slots then loaded}
  {#if loaded.hero}
    <!-- Labelled rather than headed: the visible FEATURED caption is gone, and a
         landmark with no name is worse than no landmark. -->
    <section class="strip" aria-label="Featured">
      <div class="layout">
        {@render heroCard(loaded.hero, loaded.eyebrow)}

        <div class="column">
          <!-- The same component the grid renders, so the two cannot drift. -->
          {#if loaded.secondaries[0]}
            <VideoCard video={loaded.secondaries[0]} />
          {/if}

          {#if loaded.event}
            <Link href={`/?event=${encodeURIComponent(loaded.event.slug)}`}>
              <div class="event">
                <span class="event-label">Videos from our latest event</span>
                <h3 class="event-name">{loaded.event.name}</h3>
                <span class="event-count">
                  {loaded.event.total}
                  {loaded.event.total === 1 ? "video" : "videos"}
                </span>
              </div>
            </Link>
          {/if}
        </div>
      </div>
    </section>
  {/if}
{/await}

<style>
  /* The top margin stands in for the FEATURED label that used to sit here and
     hold the strip off the tabs above it. */
  .strip {
    margin-top: 1.375rem;
    margin-bottom: 1.375rem;
  }

  .layout {
    display: grid;
    grid-template-columns: 1.55fr 1fr;
    gap: 1.375rem;
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /*
   * Direct children only.
   *
   * These are the slot links — the event card — and
   * they are card surfaces, so they fill their space and drop the underline. The
   * hero's credit links are ordinary inline links inside a paragraph, exactly as
   * they are on a video card, and a blanket rule here turned them into blocks:
   * the event name wrapped to its own line and a presenter's hover underline ran
   * the full width of the card.
   */
  .column > :global(a) {
    display: block;
    text-decoration: none;
  }

  /* Pins the event card to the bottom of the column. */
  .column :global(a:last-child) {
    margin-top: auto;
  }

  /* The same surface, edge and lift as a video card, from the same tokens. */
  .hero-card {
    display: flex;
    flex-direction: column;
    background: var(--dyalog-video-library-surface);
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    box-shadow: var(--dyalog-video-library-card-shadow);
    transition: var(--dyalog-video-library-card-transition);
  }

  .hero-card:hover {
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
  }

  /* The thumbnail-and-title link, as a direct child, for the same reason. */
  .hero-card > :global(a) {
    display: flex;
    flex-direction: column;
    color: inherit;
    text-decoration: none;
  }

  .thumb {
    display: block;
    overflow: hidden;
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-thumb-bg);
  }

  .hero-card .thumb {
    height: 330px;
    border-radius: var(--dyalog-video-library-radius)
      var(--dyalog-video-library-radius) 0 0;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Reads exactly as the Browse line does: same step, same weight, same label
     colour, and no uppercasing or tracking. Shared with the event card's. */
  .hero-label,
  .event-label {
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-muted);
  }

  .hero-label {
    padding: 0.75rem 0.75rem 0;
  }

  /* Klavika, like every other title in the app, which a heading gets from the
     reset in app.css. The id is what clears that reset's own 1,0,0. */
  :global(#dyalog-video-library) .hero-card .hero-label + h3 {
    padding-top: 0.25rem;
  }

  :global(#dyalog-video-library) .hero-card h3 {
    max-width: 30ch;
    padding: 0.75rem 0.75rem 0.25rem;
    font-size: var(--dyalog-video-library-size-2xl);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-link);
  }

  :global(#dyalog-video-library) .hero-card:hover h3 {
    color: var(--dyalog-video-library-accent);
  }

  /* Credits and meta, sized and spaced as a video card's are. */
  .presenters {
    padding: 0 0 0 0.75rem;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
  }

  .meta {
    padding: 0.5rem 0.75rem;
  }

  .meta p {
    display: flex;
    justify-content: space-between;
    margin: 1rem 0;
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    line-height: var(--dyalog-video-library-meta-line-height);
    color: var(--dyalog-video-library-text-strong);
  }

  hr {
    border: 0;
    border-top: 1px solid var(--dyalog-video-library-rule);
  }

  .event {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.875rem 1rem;
    background: var(--dyalog-video-library-surface);
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
  }

  /* Titled as a video card is titled: Klavika from the heading reset, the same
     step, weight and link colour, and the same shift to accent on hover. */
  :global(#dyalog-video-library) .event h3 {
    font-size: var(--dyalog-video-library-size-lg);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-link);
  }

  :global(#dyalog-video-library) .event:hover h3 {
    color: var(--dyalog-video-library-accent);
  }

  .event-count {
    font-size: var(--dyalog-video-library-size-xs);
    color: var(--dyalog-video-library-muted);
  }

  /* One column, so the hero is not a third of a phone screen wide. */
  @media (max-width: 640px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .hero-card .thumb {
      height: 220px;
    }
  }
</style>
