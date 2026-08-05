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
    background-color: var(--dyalog-video-library-primary-dark);
  }

  ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding-top: 0.5rem;
    gap: 0.5rem;
  }

  /* The tab is Link's anchor, so the selector has to reach into another
     component's markup. */
  ul :global(a) {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: var(--dyalog-video-library-radius)
      var(--dyalog-video-library-radius) 0 0;
    background-color: var(--dyalog-video-library-primary-dark);
    color: var(--dyalog-video-library-on-primary);
    text-decoration: none;
  }

  ul :global(a[aria-current="page"]) {
    color: var(--dyalog-video-library-text);
    background-color: var(--dyalog-video-library-page-bg);
  }
</style>
