<script lang="ts">
  // The browse destinations. Links rather than ARIA tabs: each one is a route,
  // so it bookmarks, middle-clicks and survives back/forward, and announcing
  // "tab" would promise a panel swap instead of a navigation.
  import Link from "../../lib/router/Link.svelte";
  import { location } from "../../lib/router/location.svelte";

  type Tab = {
    label: string;
    /** Where it goes. */
    href: string;
    /** Every route it is the current one for, `href` included. */
    covers: string[];
  };

  const tabs: Tab[] = [
    // /search renders the same view with filters in the URL, so it is this
    // destination rather than a place of its own. /watch is a single video and
    // is covered by nothing: no destination is current there.
    { label: "Videos", href: "/", covers: ["/", "/search"] },
    { label: "Events", href: "/events", covers: ["/events"] },
    { label: "Presenters", href: "/presenters", covers: ["/presenters"] },
    // Not a way of browsing the library, but it has to be reachable from every
    // page, and a link at the foot of a page this long was not.
    { label: "Terms of Use", href: "/terms", covers: ["/terms"] },
  ];
</script>

<nav class="band" aria-label="Browse">
  <ul class="video-library-x-padding">
    {#each tabs as tab (tab.href)}
      <li>
        <!-- Absent rather than "false" on the others: aria-current has no false
             value, and the string would announce every tab as the current one. -->
        <Link
          href={tab.href}
          aria-current={tab.covers.includes(location.pathname)
            ? "page"
            : undefined}
        >
          {tab.label}
        </Link>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .band {
    display: flex;
    justify-content: center;
    background-color: var(--dyalog-video-library-band);
  }

  ul {
    display: flex;
    list-style: none;
    margin: 0;
    gap: 0.5rem;
  }

  /*
   * The mount id, because app.css zeroes padding on every ol and ul inside the
   * mount at 1,0,0 — a scoped `ul` rule is 0,1,1 and loses to it. The padding
   * here had no effect at all, at either value, and the only gap above the tabs
   * was the search row's own bottom padding.
   *
   * This is the whole gap between the tabs and whatever sits above them: the
   * search row, or the filter panel when it is open.
   */
  :global(#dyalog-video-library) ul {
    padding-top: 1rem;
  }

  /*
   * The tab is Link's anchor, so the selector has to reach into another
   * component's markup.
   *
   * Sized and weighted as .video-library-label is, but not using that class: it
   * carries the muted label colour, and a tab needs to hold its own against the
   * band behind it — white while inactive, the text colour once it is the page.
   */
  ul :global(a) {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: var(--dyalog-video-library-radius)
      var(--dyalog-video-library-radius) 0 0;
    background-color: var(--dyalog-video-library-band);
    font-size: var(--dyalog-video-library-size-sm);
    font-weight: var(--dyalog-video-library-weight-regular);
    color: var(--dyalog-video-library-on-primary);
    text-decoration: none;
  }

  /* Not the current tab: it sits on the page background, where the light orange
     would all but disappear. */
  ul :global(a:not([aria-current="page"]):hover) {
    color: var(--dyalog-video-library-tab-hover);
  }

  ul :global(a[aria-current="page"]) {
    color: var(--dyalog-video-library-text);
    background-color: var(--dyalog-video-library-page-bg);
  }
</style>
