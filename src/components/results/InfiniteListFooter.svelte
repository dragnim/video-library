<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { ListState } from "../../lib/data/videoList.svelte";
  import Skeleton from "./Skeleton.svelte";

  interface Props {
    state: ListState;
    loadMore: () => void;
    retry: () => void;
    /** Names the thing being counted, in the terminal line and the error. */
    noun?: string;
  }

  let { state, loadMore, retry, noun = "items" }: Props = $props();

  /** Far enough ahead that a page arrives before the user reaches the end. */
  const ROOT_MARGIN = "600px";

  const loading = $derived(
    state.kind === "loading" || state.kind === "appending",
  );
  const exhausted = $derived(state.kind === "ready" && state.exhausted);
  const total = $derived(state.kind === "ready" ? state.total : 0);
  const hasItems = $derived(state.kind !== "loading" && state.items.length > 0);

  // The observer sits next to the element it observes, so it reaches loadMore
  // directly. dvl's engine owned it and needed a ref to reach a fresh handler.
  const watchSentinel: Attachment = (element) => {
    const observer = new IntersectionObserver(
      (entries) => {
        // One page per fire. IntersectionObserver only delivers on transitions,
        // so a page landing while the sentinel is still inside the margin fires
        // nothing until the user scrolls, which Load more covers.
        // Auto-continuing would load the whole library whenever the sentinel
        // stays in view.
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: ROOT_MARGIN },
    );

    observer.observe(element);

    return () => observer.disconnect();
  };
</script>

<div class="footer">
  <div class="sentinel" aria-hidden="true" {@attach watchSentinel}></div>

  {#if loading}
    <Skeleton />
    <p class="message" role="status">
      {hasItems ? "Loading more…" : "Loading…"}
    </p>
  {/if}

  {#if state.kind === "error"}
    <p class="message" role="alert">
      Couldn't load more {noun}.
      <button type="button" class="retry" onclick={retry}>Retry</button>
    </p>
  {/if}

  <!-- Stays mounted across the click, load and settle: unmounting it would drop
       keyboard focus to <body> on every click, and it is the keyboard, no-JS and
       screen-reader path rather than a decoration on the observer.
       `aria-disabled` rather than `disabled` for the same reason, since the
       browser blurs a button that is disabled while focused. A click while
       loading reaches the engine, which ignores it. -->
  {#if state.kind !== "error" && !exhausted}
    <button
      type="button"
      class="load-more"
      onclick={loadMore}
      aria-disabled={loading}
    >
      Load more
    </button>
  {/if}

  <!-- A list with no results gets the page's empty state, not "all 0 videos". -->
  {#if exhausted && total > 0}
    <p class="message">That's all {total} {noun}.</p>
  {/if}
</div>

<style>
  .sentinel {
    height: 1px;
  }

  .message {
    padding: 1rem 0;
    text-align: center;
    color: var(--dyalog-video-library-muted);
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. The
     disabled rule takes the id too, or this one would outrank it. */
  :global(#dyalog-video-library) .load-more,
  :global(#dyalog-video-library) .retry {
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    background: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-primary);
    font-weight: 600;
    cursor: pointer;
  }

  .load-more {
    display: block;
    margin: 1rem auto;
    padding: 0.625rem 1.5rem;
  }

  :global(#dyalog-video-library) .load-more[aria-disabled="true"] {
    cursor: default;
    color: var(--dyalog-video-library-muted);
  }

  .retry {
    margin-left: 0.25rem;
    padding: 0.125rem 0.625rem;
  }

  @media (max-width: 640px) {
    .load-more {
      min-height: 44px;
    }
  }
</style>
