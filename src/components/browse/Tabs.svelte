<script lang="ts">
  import Link from "../../lib/router/Link.svelte";
  import { location, navigate } from "../../lib/router/location.svelte";

  type Tab = {
    label: string;
    path: string;
  };

  const tabs: Tab[] = [
    { label: "Videos", path: "/" },
    { label: "Events", path: "/events" },
  ];

  // -1 when the current route is none of these tabs (eg. /watch), in which
  // case no tab shows as selected.
  const activeIndex = $derived(
    tabs.findIndex((tab) => tab.path === location.pathname),
  );

  // Arrow-key roving focus between tabs, per the WAI-ARIA tabs pattern. This
  // is "automatic activation": moving focus also navigates, same as a click.
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (activeIndex === -1) return;

    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + delta + tabs.length) % tabs.length;

    navigate(tabs[nextIndex].path);
    (event.currentTarget as HTMLElement)
      .closest("[role='tablist']")
      ?.querySelector<HTMLElement>(`#tab-${nextIndex}`)
      ?.focus();
  };
</script>

<div class="band">
  <ul role="tablist" class="video-library-x-padding">
    {#each tabs as tab, index (tab.path)}
      <li role="presentation">
        <Link
          href={tab.path}
          id="tab-{index}"
          role="tab"
          aria-selected={index === activeIndex}
          tabindex={index === activeIndex ? 0 : -1}
          onkeydown={handleKeydown}
        >
          {tab.label}
        </Link>
      </li>
    {/each}
  </ul>
</div>

<style>
  .band {
    display: flex;
    justify-content: center;
    background-color: var(--dyalog-video-library-primary-dark);
  }

  ul[role="tablist"] {
    display: flex;
    list-style: none;
    margin: 0;
    padding-top: 0.5rem;
    gap: 0.5rem;
  }

  /* The tab is Link's anchor, so the selector has to reach into another
     component's markup. */
  ul[role="tablist"] :global(a[role="tab"]) {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: var(--dyalog-video-library-radius)
      var(--dyalog-video-library-radius) 0 0;
    background-color: var(--dyalog-video-library-primary-dark);
    color: var(--dyalog-video-library-on-primary);
    text-decoration: none;
  }

  ul[role="tablist"] :global(a[role="tab"][aria-selected="true"]) {
    color: var(--dyalog-video-library-text);
    background-color: var(--dyalog-video-library-page-bg);
  }
</style>
