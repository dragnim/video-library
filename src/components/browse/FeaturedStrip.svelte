<script lang="ts">
  // The editorial strip: a hero, two secondaries and the featured event, four
  // links and four tab stops. What is featured comes from config.js, so the
  // strip resolves its own slots and there is nothing here for a page to wire.
  import type { Video } from "../../lib/api/types";
  import { getVideo, listVideos } from "../../lib/api/videos";
  import { featuredConfig, type FeaturedConfig } from "../../lib/config";
  import Link from "../../lib/router/Link.svelte";
  import { DEFAULT_FILTERS } from "../../lib/utils/browseFilters";
  import { presenterLabels, separator } from "../results/presenters";

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

  /** Hero plus two secondaries, when nothing is configured. */
  const FALLBACK_SLOTS = 3;

  /** A slot pointing at content that no longer exists renders nothing. */
  const slot = (id: string) => getVideo(id).catch(() => null);

  async function loadEvent(slug: string): Promise<FeaturedEvent | null> {
    // One row, for the total: `total` counts the event, where dvl requested six
    // and rendered the number it got back, so an event of 40 read "6 videos".
    const page = await listVideos(
      { ...DEFAULT_FILTERS, event: slug },
      { page: 1, perpage: 1 },
    ).catch(() => null);

    const first = page?.items[0];
    if (!first) return null;

    return { slug, name: first.event || slug, total: page.total };
  }

  async function loadFallback(): Promise<Slots> {
    const page = await listVideos(DEFAULT_FILTERS, {
      page: 1,
      perpage: FALLBACK_SLOTS,
    }).catch(() => null);

    const [hero, ...secondaries] = page?.items ?? [];

    return { hero: hero ?? null, eyebrow: "", secondaries, event: null };
  }

  async function loadSlots(): Promise<Slots> {
    if (config === null) return loadFallback();

    const { hero, heroEyebrow, secondaryIds, eventSlug } = config;

    // One request per configured slot, none for a slot that is not configured.
    // dvl issued a `perpage=1&pg=1` request for the slots it did not want, to
    // keep its hook count stable between renders.
    const [resolvedHero, secondaries, event] = await Promise.all([
      slot(hero),
      Promise.all(secondaryIds.map(slot)),
      eventSlug === null ? null : loadEvent(eventSlug),
    ]);

    return {
      hero: resolvedHero,
      eyebrow: heroEyebrow,
      secondaries: secondaries.filter((video) => video !== null),
      event,
    };
  }

  const slots = loadSlots();

  function credits(video: Video): string {
    const presenters = presenterLabels(video.presenterIds);
    const names = presenters
      .map(
        (presenter, index) =>
          presenter.label + separator(index, presenters.length),
      )
      .join("");

    // Presenter · Event. The handoff asks for a duration too, and no field on
    // the API carries one.
    return video.event === "" ? names : `${names} · ${video.event}`;
  }
</script>

{#snippet feature(video: Video, hero: boolean, eyebrow: string)}
  <Link href={`/watch?v=${video.youtubeId}`}>
    <span class={["thumb", hero ? "hero" : "secondary"]}>
      <img src={video.thumbnail} alt="" loading="lazy" decoding="async" />
      <span class="scrim"></span>
      <span class="caption">
        {#if hero && eyebrow !== ""}
          <span class="eyebrow">{eyebrow}</span>
        {/if}
        <span class="title">{video.title}</span>
        {#if hero}
          <span class="meta">{credits(video)}</span>
        {/if}
      </span>
    </span>
  </Link>
{/snippet}

{#await slots then loaded}
  {#if loaded.hero}
    <section class="strip">
      <p class="label"><span>FEATURED</span></p>

      <div class="layout">
        {@render feature(loaded.hero, true, loaded.eyebrow)}

        <div class="column">
          {#each loaded.secondaries as video (video.youtubeId)}
            {@render feature(video, false, "")}
          {/each}

          {#if loaded.event}
            <Link href={`/?event=${encodeURIComponent(loaded.event.slug)}`}>
              <span class="event">
                <span class="eyebrow">FROM THIS EVENT</span>
                <span class="event-name">{loaded.event.name}</span>
                <span class="event-count">
                  {loaded.event.total}
                  {loaded.event.total === 1 ? "video" : "videos"}
                </span>
              </span>
            </Link>
          {/if}
        </div>
      </div>
    </section>
  {/if}
{/await}

<style>
  .strip {
    margin-bottom: 1.375rem;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--dyalog-video-library-muted);
  }

  /* The rule runs from the label to the end of the row. */
  .label::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--dyalog-video-library-rule);
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

  .strip :global(a) {
    display: block;
    text-decoration: none;
  }

  /* Pins the event card to the bottom of the column. */
  .column :global(a:last-child) {
    margin-top: auto;
  }

  .thumb {
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-thumb-bg);
  }

  .thumb.hero {
    height: 330px;
  }

  .thumb.secondary {
    height: 74px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Full height, not a bottom fade: many thumbnails are slides with burned-in
     titles that collide with the title laid over them. */
  .scrim {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      var(--dyalog-video-library-scrim-strong),
      var(--dyalog-video-library-scrim-mid) 55%,
      var(--dyalog-video-library-scrim-soft)
    );
  }

  .caption {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 1rem;
    color: var(--dyalog-video-library-on-scrim-strong);
  }

  .eyebrow {
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--dyalog-video-library-eyebrow);
  }

  .hero .title {
    max-width: 22ch;
    font-size: 1.5625rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .secondary .title {
    font-size: 0.84375rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .meta {
    font-size: 0.75rem;
    color: var(--dyalog-video-library-on-scrim);
  }

  .event {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.875rem 1rem;
    background: var(--dyalog-video-library-surface);
    border: 1px solid var(--dyalog-video-library-card-border);
    border-left: 3px solid var(--dyalog-video-library-secondary);
    border-radius: var(--dyalog-video-library-radius);
  }

  .event .eyebrow {
    color: var(--dyalog-video-library-muted);
  }

  .event-name {
    font-size: 1rem;
    font-weight: 700;
    color: var(--dyalog-video-library-primary);
  }

  .event-count {
    font-size: 0.75rem;
    color: var(--dyalog-video-library-muted);
  }

  /* One column, so the hero is not a third of a phone screen wide. */
  @media (max-width: 640px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .thumb.hero {
      height: 220px;
    }
  }
</style>
