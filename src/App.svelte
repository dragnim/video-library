<script lang="ts">
  import SearchBar from "./components/chrome/SearchBar.svelte";
  import Tabs from "./components/browse/Tabs.svelte";
  import { location } from "./lib/router/location.svelte";
  import { routes } from "./lib/router/routes";
  import { loadRosters } from "./lib/state/rosters.svelte";

  // A capitalised variable renders as a component, and re-renders when it
  // changes. Unregistered paths fall through to home; see routes.ts.
  const Current = $derived(routes[location.pathname] ?? routes["/"]);

  // Presenter names and event names are wanted by whatever renders first, and
  // the two requests do not depend on the route.
  loadRosters();

  let outlet: HTMLElement;
  let focusedKey = "";

  // When links are clicked, they update location history via JavaScript, sometimes meaning the clicked element is no longer on the new page.
  // Browser then focuses on <body> (top of document) by default, which is confusing for someone using the app that looks like the same page with multiple views.
  // Our workaround is to put the focus on a fixed "outlet" element on navigation, so that keyboard users and screen readers are not refocused to the top of the page on every action.
  // `location.action === "PUSH"` means that this only happens on our SPA navigations, not on user forward/back (so they preserve expected default behaviours).
  // Compare location.key rather than location.pathname because a push (e.g. ?q=search+query) doesn't always change the pathname so search queries would still move the focus in that case
  $effect(() => {
    if (location.action === "PUSH" && location.key !== focusedKey) {
      focusedKey = location.key;
      outlet.focus();
    }
  });
</script>

<svelte:head>
  <title>Dyalog Video Library</title>
  <meta
    name="description"
    content="Watch and browse APL programming videos, conference talks, and community content on the Dyalog Video Library"
  />
</svelte:head>

<SearchBar />

<Tabs />

<div class="page">
  <div class="video-library-x-padding">
    <div class="outlet" tabindex="-1" bind:this={outlet}>
      <Current />
    </div>
  </div>
</div>

<style>
  .page {
    display: flex;
    justify-content: center;
  }

  /*
   * Every route starts clear of the tab band above it, and ends clear of the
   * WordPress footer below it.
   *
   * The bottom margin used to be the terms footer's presence. Moving that to its
   * own route left every page — watch, home, search, all of them — ending flush
   * against the bottom of the page.
   */
  .outlet {
    margin-top: 0.75rem;
    margin-bottom: 1.5rem;
  }

  /*
   * Focused programmatically on a route change, so it gets no ring: the global
   * :focus-visible rule covers focus the user asked for.
   *
   * The mount id, because that global rule is `#dyalog-video-library
   * :focus-visible` at 1,0,0 and this one was `.outlet:focus` at 0,3,0 — it lost,
   * and every keyboard navigation drew a two-pixel outline around the whole page.
   * :focus-visible as well as :focus, since the losing rule named only the latter.
   */
  :global(#dyalog-video-library) .outlet:focus,
  :global(#dyalog-video-library) .outlet:focus-visible {
    outline: none;
  }
</style>
