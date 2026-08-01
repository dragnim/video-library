import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import("@sveltejs/vite-plugin-svelte").SvelteConfig} */
export default {
  // Enables TypeScript (and other) syntax inside <script> blocks in .svelte files.
  preprocess: vitePreprocess(),
};
