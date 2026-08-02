<script lang="ts">
  import { assetsPrefix } from "../../lib/env";
  import Link from "../../lib/router/Link.svelte";
  import { location, navigate } from "../../lib/router/location.svelte";
  import { parseFilters } from "../../lib/utils/browseFilters";
  import { performSearch } from "../../lib/utils/performSearch";

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

      <!-- The advanced-options toggle button sits here, beside Search, and
           arrives with the panel it opens. -->
    </form>

    <!-- The mode strip goes here, between the form and the advanced-search
         panel: Videos / Events / Presenters with their counts. It needs
         location.pathname for the active tab and the three totals. -->
  </div>
</section>

<style>
  .band {
    display: flex;
    justify-content: center;
    margin-bottom: 1.25rem;
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
    background-color: #ffffff;
    color: var(--dyalog-video-library-text);
    font-size: 1.1em;
  }

  button {
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
