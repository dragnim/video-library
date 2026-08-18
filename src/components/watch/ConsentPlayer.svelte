<script lang="ts">
  // Two stages, so YouTube is contacted only once the viewer asks for it:
  // a still frame served from our own host, then the nocookie iframe.
  import { assetsPrefix } from "../../lib/env";

  let {
    youtubeId,
    title,
    thumbnail,
    startSeconds = 0,
  }: {
    youtubeId: string;
    title: string;
    thumbnail: string;
    /** Where a `?time=` deep link asks the player to start. */
    startSeconds?: number;
  } = $props();

  // Reset per video by the caller keying this component on the id: consent is
  // a fresh decision each time, and a reused iframe turns Back into a rewind.
  let playing = $state(false);
  let loaded = $state(false);

  const src = $derived.by(() => {
    const url = new URL(`https://www.youtube-nocookie.com/embed/${youtubeId}`);
    url.searchParams.set("rel", "0");
    url.searchParams.set("autoplay", "1");
    if (startSeconds > 0) url.searchParams.set("start", String(startSeconds));
    return url.href;
  });

  const consentUrl = "https://support.google.com/youtube/answer/10364219";
</script>

<div class="frame">
  {#if playing}
    <iframe
      {src}
      {title}
      allowfullscreen
      class:loaded
      onload={() => (loaded = true)}
    ></iframe>
  {:else}
    <!-- The whole still frame is the button, as on the live site. The notice
         inside it is what the viewer is agreeing to, so it is the label. -->
    <button type="button" onclick={() => (playing = true)}>
      <img src={thumbnail} alt="" />
      <img class="badge" src={`${assetsPrefix}/yt-big.png`} alt="" />
      <span class="notice">
        Click to load video from YouTube. This will enable YouTube tracking.
      </span>
    </button>
    <a
      class="policy"
      href={consentUrl}
      target="_blank"
      rel="noopener noreferrer">YouTube Privacy Information</a
    >
  {/if}
</div>

<style>
  .frame {
    position: relative;
    aspect-ratio: 16 / 9;
    background: var(--dyalog-video-library-thumb-bg);
  }

  iframe {
    width: 100%;
    height: 100%;
    border: 0;
    /* The frame paints before YouTube has anything in it, and the gap reads as
       a black flash over the thumbnail that was just there. */
    opacity: 0;
    transition: opacity 450ms ease-in-out;
  }

  iframe.loaded {
    opacity: 1;
  }

  /* The mount id, since the kit styles bare buttons. :global, or Svelte prunes
     the rule as unused. */
  :global(#dyalog-video-library) .frame button {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .badge {
    position: absolute;
    top: 50%;
    left: 50%;
    width: auto;
    height: auto;
    transform: translate(-50%, -50%);
    filter: grayscale(1) contrast(1.3);
    transition: filter 100ms;
  }

  button:hover .badge,
  button:focus-visible .badge {
    filter: none;
  }

  .notice,
  .policy {
    position: absolute;
    bottom: 1em;
    padding: 0.1ex 0.5ex;
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-scrim-mid);
    color: var(--dyalog-video-library-on-scrim-strong);
    font-size: var(--dyalog-video-library-size-sm);
    text-align: left;
  }

  .notice {
    left: 1ex;
    max-width: 60%;
  }

  /* Outside the button: a link inside one is not reachable by keyboard, and on
     the live site clicking it starts the video it is explaining. */
  .policy {
    right: 1ex;
    color: var(--dyalog-video-library-on-scrim-strong);
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .notice {
      max-width: none;
      right: 1ex;
      bottom: 3em;
    }
  }
</style>
