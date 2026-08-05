<script lang="ts">
  // One video: the consent embed, its credits, its description, and what to
  // watch next. The video is identified by `?v=`, and `?time=` seeks within it.
  import ConsentPlayer from "../components/watch/ConsentPlayer.svelte";
  import VideoDescription from "../components/watch/VideoDescription.svelte";
  import ResultGrid from "../components/results/ResultGrid.svelte";
  import Spinner from "../components/ui/Spinner.svelte";
  import Link from "../lib/router/Link.svelte";
  import { ApiError } from "../lib/api/client";
  import type { Video } from "../lib/api/types";
  import { getRecommendations, getVideo } from "../lib/api/videos";
  import { back, location, navigate } from "../lib/router/location.svelte";
  import {
    eventHref,
    presenterHref,
    presenterLabels,
    separator,
  } from "../components/results/presenters";
  import { formatDate } from "../lib/utils/formatDate";

  /** Two rows of the three-column grid. dvl asked for eight. */
  const SUGGESTION_COUNT = 6;

  type WatchState =
    | { kind: "loading" }
    | { kind: "ready"; video: Video }
    /** The API answered 404: the video is gone, and the library is fine. */
    | { kind: "missing" }
    | { kind: "failed" };

  const params = $derived(new URLSearchParams(location.search));
  const youtubeId = $derived(params.get("v") ?? "");
  // A hand-edited or truncated `?time=` should start the video, not break it.
  const startSeconds = $derived(
    Math.max(0, Math.trunc(Number(params.get("time"))) || 0),
  );

  let watchState = $state.raw<WatchState>({ kind: "loading" });
  let suggestions = $state.raw<Video[]>([]);

  // A response for the video the user has already navigated away from belongs
  // to a page that no longer exists.
  let generation = 0;

  $effect(() => {
    const id = youtubeId;

    // Nothing to watch. Replace, so Back does not return to a bare /watch.
    if (id === "") {
      navigate("/", { replace: true });
      return;
    }

    const startedAt = ++generation;
    watchState = { kind: "loading" };
    suggestions = [];

    void getVideo(id)
      .then((video) => {
        if (startedAt === generation) watchState = { kind: "ready", video };
      })
      .catch((error: unknown) => {
        if (startedAt !== generation) return;
        watchState =
          error instanceof ApiError && error.status === 404
            ? { kind: "missing" }
            : { kind: "failed" };
      });

    // Secondary: a failure here leaves the section out rather than the page.
    void getRecommendations(id, SUGGESTION_COUNT)
      .then((videos) => {
        if (startedAt === generation) suggestions = videos;
      })
      .catch(() => {});
  });

  /**
   * A single video is a leaf: no browse destination is current here, so the page
   * says where it came from itself. Back rather than a link to the results,
   * because only the history entry carries the scroll position in the list.
   */
  const canGoBack = $derived(location.depth > 0);

  // Named around the `$state` rune: a variable called `state` makes `$state`
  // ambiguous with store-value syntax and the file stops type-checking.
  const video = $derived(watchState.kind === "ready" ? watchState.video : null);
  const presenters = $derived(presenterLabels(video?.presenterIds ?? []));

  const title = $derived(
    video ? `${video.title} - Dyalog Video Library` : "Dyalog Video Library",
  );

  /**
   * The tag a literal closing tag in this block would end. Interpolated so the
   * source does not contain one.
   */
  const LD_JSON = {
    open: `<script type="application/ld+json">`,
    close: `</${"script"}>`,
  };

  /**
   * Search engines read the video off this rather than off the embed, which is
   * not there until the viewer consents. Every `<` is escaped, so a description
   * cannot carry markup into the document.
   */
  const jsonLd = $derived(
    video === null
      ? ""
      : JSON.stringify({
          "@context": "https://schema.org",
          "@type": "VideoObject",
          name: video.title,
          description: video.description,
          thumbnailUrl: video.thumbnail,
          uploadDate: video.publishedAt?.toISOString(),
          embedUrl: `https://www.youtube-nocookie.com/embed/${video.youtubeId}`,
        }).replace(/</g, "\\u003c"),
  );
</script>

<svelte:head>
  <title>{title}</title>
  {#if video}
    <meta name="description" content={video.description} />
    <!-- A script element written in markup would be taken for the component's
         own, so the tag is assembled as text. Safe because jsonLd escapes `<`. -->
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html `${LD_JSON.open}${jsonLd}${LD_JSON.close}`}
  {/if}
</svelte:head>

{#if canGoBack}
  <button type="button" class="back" onclick={back}>
    <span aria-hidden="true">&larr;</span> Back
  </button>
{:else}
  <!-- Arrived cold, so there is nothing of ours behind this entry to go back to
       and the only honest offer is the way up. -->
  <Link href="/" class="back"
    ><span aria-hidden="true">&larr;</span> Library</Link
  >
{/if}

{#if watchState.kind === "loading"}
  <Spinner />
{:else if watchState.kind === "missing"}
  <p class="unavailable">
    This video is not available. Return to the <Link href="/"
      >Video Library</Link
    >.
  </p>
{:else if watchState.kind === "failed"}
  <p class="unavailable">
    This video could not be loaded. Try again, or return to the <Link href="/"
      >Video Library</Link
    >.
  </p>
{:else if video}
  <!-- Keyed on the id: consent is asked again per video, and the iframe is
       replaced rather than reused. -->
  {#key youtubeId}
    <ConsentPlayer
      {youtubeId}
      title={`Watch YouTube video ${video.title}`}
      thumbnail={video.thumbnail}
      {startSeconds}
    />
  {/key}

  <article class="detail">
    <h1>{video.title}</h1>

    {#if presenters.length > 0}
      <p class="presenters">
        {#each presenters as presenter, index (presenter.id)}
          <Link href={presenterHref(presenter.id)}>{presenter.label}</Link
          >{separator(index, presenters.length)}
        {/each}
      </p>
    {/if}

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

    <VideoDescription description={video.description} {youtubeId} />
  </article>

  {#if suggestions.length > 0}
    <h2 class="suggested">Suggested videos</h2>
    <hr />
    <ResultGrid items={suggestions} />
  {/if}
{/if}

<style>
  /* The mount id, since the kit styles bare buttons. :global, or Svelte prunes
     the rule, and Link's anchor is another component's markup either way. */
  :global(#dyalog-video-library) .back {
    display: inline-block;
    margin-bottom: 0.5rem;
    padding: 0;
    border: 0;
    background: none;
    color: var(--dyalog-video-library-link);
    font-size: 0.875rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }

  :global(#dyalog-video-library) .back:hover {
    color: var(--dyalog-video-library-accent);
    text-decoration: underline;
  }

  .unavailable {
    padding: 6rem 0;
    text-align: center;
    color: var(--dyalog-video-library-muted);
  }

  .detail {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
  }

  h1 {
    margin-bottom: 0.75rem;
    font-size: 2em;
  }

  .presenters {
    font-weight: 700;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    margin: 0.75rem 0;
    font-weight: 700;
  }

  .suggested {
    padding-top: 1rem;
    font-weight: 700;
  }

  hr {
    margin: 1.25rem 0;
    border: 0;
    border-top: 1px solid var(--dyalog-video-library-rule);
  }

  /* One column stacks the date under the event, as the card does not. */
  @media (max-width: 640px) {
    .meta {
      flex-direction: column;
    }
  }
</style>
