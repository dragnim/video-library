<script lang="ts">
  // A chip that opens a panel of choices. Which menu is open belongs to the bar,
  // so only one can be; dismissal belongs here, where the panel's element is.
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import Chip from "./Chip.svelte";

  interface Props {
    label: string;
    open: boolean;
    onToggle: () => void;
    onClose: () => void;
    children: Snippet;
  }

  let { label, open, onToggle, onClose, children }: Props = $props();

  let trigger = $state<HTMLButtonElement>();

  /**
   * Escape and a click elsewhere close the menu. Attached only while it is open,
   * so a closed menu listens to nothing. dvl closes on neither.
   */
  const dismiss: Attachment = (element) => {
    function onPointerdown(event: PointerEvent): void {
      // The trigger is inside the element, so its own click toggles as usual.
      if (element.contains(event.target as Node)) return;

      onClose();
    }

    function onKeydown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;

      onClose();
      // The panel is about to unmount, and focus inside it would fall to <body>.
      trigger?.focus();
    }

    window.addEventListener("pointerdown", onPointerdown);
    window.addEventListener("keydown", onKeydown);

    return () => {
      window.removeEventListener("pointerdown", onPointerdown);
      window.removeEventListener("keydown", onKeydown);
    };
  };
</script>

<span class="wrap" {@attach open && dismiss}>
  <Chip bind:element={trigger} aria-expanded={open} onclick={onToggle}>
    {label}<span aria-hidden="true">▾</span>
  </Chip>

  {#if open}
    <div class="menu">
      {@render children()}
    </div>
  {/if}
</span>

<style>
  .wrap {
    position: relative;
  }

  .menu {
    position: absolute;
    top: calc(100% + 0.375rem);
    left: 0;
    z-index: 10;
    min-width: 220px;
    max-height: 320px;
    overflow-y: auto;
    padding: 0.5rem;
    background: #ffffff;
    border: 1px solid var(--dyalog-video-library-card-border);
    border-radius: var(--dyalog-video-library-radius);
    box-shadow: var(--dyalog-video-library-card-hover-shadow);
  }
</style>
