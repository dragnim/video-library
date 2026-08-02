<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { addBasename, navigate, stripBasename } from "./location.svelte";

  interface Props extends HTMLAnchorAttributes {
    /** A basename-free app path, as `navigate` takes. */
    href: string;
    children: Snippet;
  }

  let { href, children, onclick, ...rest }: Props = $props();

  // Resolving against the current origin is what makes an external href
  // (a config-supplied URL, say) detectable: same-origin means ours to route.
  const resolved = $derived(new URL(href, window.location.origin));
  const internal = $derived(resolved.origin === window.location.origin);
  // Stripping before adding keeps a full same-origin URL and a bare app path
  // on the same target, so the basename can never be prepended twice.
  const target = $derived(stripBasename(resolved.pathname) + resolved.search);
  const renderedHref = $derived(
    internal
      ? addBasename(stripBasename(resolved.pathname)) + resolved.search
      : href,
  );

  function handleClick(
    event: MouseEvent & { currentTarget: HTMLAnchorElement },
  ) {
    // The caller's handler runs first, and can preventDefault to keep the click.
    onclick?.(event);

    if (!internal) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.defaultPrevented) return;
    if (rest.target && rest.target !== "_self") return;

    event.preventDefault();
    navigate(target);
  }
</script>

<a {...rest} href={renderedHref} onclick={handleClick}>
  {@render children()}
</a>
