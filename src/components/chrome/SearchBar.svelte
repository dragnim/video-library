<script lang="ts">
  import { assetsPrefix } from "../../lib/env";
  import Link from "../../lib/router/Link.svelte";
  import { location, navigate } from "../../lib/router/location.svelte";
  import { searchPanel } from "../../lib/state/searchPanel.svelte";
  import { parseFilters } from "../../lib/utils/browseFilters";
  import { performSearch } from "../../lib/utils/performSearch";

  const PANEL_ID = "video-library-advanced-options";

  // On a watch page the video title is the h1, so the band steps down to h2.
  const heading = $derived(location.pathname === "/watch" ? "h2" : "h1");

  // Follows the URL, so clicking a presenter name updates the box. Read
  // through parseFilters: browseFilters.ts is the only home for the vocabulary.
  const query = $derived(parseFilters(location.search).q);

  const submit = performSearch(navigate);
</script>

<section class="band">
  <div class="inner video-library-x-padding">
    <form onsubmit={submit}>
      <Link href="/">
        <svelte:element this={heading} class="heading">
          Video&nbsp;<strong>Library</strong>
        </svelte:element>
      </Link>

      <input type="search" name="q" placeholder="Search..." value={query} />

      <button type="submit" title="Search">
        <img
          src="{assetsPrefix}/icon_video-library_search_01.svg"
          alt=""
          aria-hidden="true"
          width="20"
          height="20"
        />
        Search
      </button>

      <button
        type="button"
        title="Advanced Options"
        aria-label="Advanced Options"
        aria-expanded={searchPanel.open}
        aria-controls={PANEL_ID}
        onclick={() => searchPanel.toggle()}
      >
        <img
          src="{assetsPrefix}/{searchPanel.open
            ? 'icon_video-chevron-up_01.svg'
            : 'icon_video-library_advanced-options_01.svg'}"
          alt=""
          aria-hidden="true"
          width="24"
          height="24"
        />
      </button>
    </form>

    <!-- The mode strip goes here, between the form and the advanced-search
         panel: Videos / Events / Presenters with their counts. It needs
         location.pathname for the active tab and the three totals. -->

    <!-- Kept in the DOM while closed, so aria-controls always names an element
         that exists. Its controls arrive with the pickers. -->
    <div id={PANEL_ID} class="panel" hidden={!searchPanel.open}></div>
  </div>
</section>

<style>
  .band {
    display: flex;
    justify-content: center;
    background-color: var(--dyalog-video-library-primary-dark);
    color: var(--dyalog-video-library-on-primary);
  }

  .inner {
    padding: 10px 0.4rem;
  }

  form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .heading {
    margin-right: 0.5rem;
    font-size: 1.2rem;
    font-weight: 400;
    line-height: 1.3;
    letter-spacing: -0.5px;
    color: var(--dyalog-video-library-on-primary);
  }

  /* The heading's Link renders the anchor, so the selector has to reach into
     another component's markup. Kept as narrow as a global can be. */
  form :global(a) {
    color: inherit;
    text-decoration: none;
  }

  input {
    flex: 1;
    height: 40px;
    padding: 0 1.25rem;
    border: 0;
    border-radius: 6px;
    background-color: var(--dyalog-video-library-surface);
    color: var(--dyalog-video-library-text);
    font-size: 1.1em;
  }

  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule. */
  :global(#dyalog-video-library) button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 40px;
    padding: 0 0.8rem;
    border: 0;
    border-radius: 6px;
    background-color: var(--dyalog-video-library-secondary);
    color: var(--dyalog-video-library-on-primary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    form {
      flex-direction: column;
      align-items: stretch;
    }

    .heading {
      font-size: 1.8rem;
    }

    /* Touch targets. */
    input,
    button {
      min-height: 44px;
    }

    button {
      justify-content: center;
    }
  }
</style>
