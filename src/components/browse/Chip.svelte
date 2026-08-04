<script lang="ts">
  // The chip surface: a sort chip, a menu trigger, or an applied filter.
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    /** Filled, for a chip standing for a filter the URL carries. */
    active?: boolean;
    /** The rendered button, for a caller that returns focus to it. */
    element?: HTMLButtonElement;
    children: Snippet;
  }

  let {
    active = false,
    element = $bindable(),
    children,
    ...rest
  }: Props = $props();
</script>

<button
  bind:this={element}
  type="button"
  {...rest}
  class={["chip", active && "active"]}
>
  {@render children()}
</button>

<style>
  /* The mount id, since the kit styles `button:hover` and `:focus`, which
     outranks the scoping hash. `:global`, or Svelte prunes the rule: the id is
     on the mount element, not in this markup. The active pair takes the id too,
     or this rule would outrank it. */
  :global(#dyalog-video-library) .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--dyalog-video-library-chip-border);
    border-radius: 999px;
    background: var(--dyalog-video-library-chip);
    color: var(--dyalog-video-library-text);
    font-size: 0.8125rem;
    white-space: nowrap;
    cursor: pointer;
  }

  :global(#dyalog-video-library) .chip.active,
  :global(#dyalog-video-library) .chip[aria-pressed="true"] {
    background: var(--dyalog-video-library-primary);
    border-color: var(--dyalog-video-library-primary);
    color: var(--dyalog-video-library-on-primary);
  }

  @media (max-width: 640px) {
    .chip {
      min-height: 44px;
    }
  }
</style>
