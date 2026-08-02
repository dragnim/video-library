<script lang="ts">
  import Link from "../../src/lib/router/Link.svelte";

  let { href }: { href: string } = $props();
</script>

<Link {href}>
  <button onclick={(event: MouseEvent) => event.preventDefault()}
    >already handled</button
  >
</Link>
