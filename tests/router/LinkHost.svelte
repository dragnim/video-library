<script lang="ts">
  import Link from "../../src/lib/router/Link.svelte";

  let { href, ...rest }: { href: string; [key: string]: unknown } = $props();
</script>

<Link {href} {...rest}>Watch</Link>
