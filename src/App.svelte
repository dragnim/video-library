<script lang="ts">
  import TermsFooter from "./components/chrome/TermsFooter.svelte";
  import { location } from "./lib/router/location.svelte";
  import { routes } from "./lib/router/routes";

  // A capitalised variable renders as a component, and re-renders when it
  // changes. Unregistered paths fall through to home; see routes.ts.
  const Current = $derived(routes[location.pathname] ?? routes["/"]);

  let outlet: HTMLElement;
  let focusedKey = "";

  // A push replaces the page under the link that was clicked, leaving keyboard
  // focus on <body>. Keyed by the history entry rather than the pathname, so a
  // push to the path already shown still moves focus. Back/forward is left
  // alone, for the reason the scroll policy leaves it alone.
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

<!-- SearchBar, the navy band, lands above the page. -->

<div class="page">
  <div class="video-library-x-padding">
    <div class="outlet" tabindex="-1" bind:this={outlet}>
      <Current />
    </div>
    <hr />
    <TermsFooter />
  </div>
</div>

<style>
  .page {
    display: flex;
    justify-content: center;
  }

  /* Focused programmatically on a route change, so it gets no ring: the
     global :focus-visible rule covers focus the user asked for. */
  .outlet:focus {
    outline: none;
  }

  hr {
    margin-top: 1.25rem;
    border: 0;
    border-top: 1px solid var(--dyalog-video-library-rule);
  }
</style>
