import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// The app is a client-side SPA embedded in a WordPress page: WordPress serves
// the HTML and mounts us into #dyalog-video-library. So the build must emit a
// single JS + single CSS under a stable path inside the WordPress theme.
export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  // In production the assets live alongside the WordPress theme; in dev we serve
  // from the root so the dev server and client-side routes line up.
  base:
    mode === "production"
      ? "/wp-content/themes/dyalog-2026/video-library"
      : "/",
  publicDir: "public",
  build: {
    target: "es2020",
    outDir: "build",
    // We distribute 2 files: index.js and index.css.
    // Turn off cssCodeSplit to extract everything to one stylesheet.
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // IIFE required for our embedding in WordPress. The theme file embeds a standard
        // JavaScript file in the page and we inject the app into an existing element.
        format: "iife",
        entryFileNames: "dist/app.js",
        assetFileNames: "dist/[name].[ext]",
      },
    },
  },
}));
