import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

/**
 * Klavika and IBM Plex Sans, same-origin.
 *
 * post-6.css sources both from the WordPress host by absolute URL. Fonts are
 * CORS-restricted where stylesheets are not, so those requests are blocked from
 * localhost and the page falls back to a system face without saying so. This
 * proxy lets public/dev-fonts.css ask for them under our own origin instead.
 *
 * Dev and preview only, and it does not vendor anything: Klavika is licensed and
 * this repo is public. In production WordPress serves the fonts from the same
 * origin as the page and none of this applies.
 */
const fontProxy = {
  // Trailing slash on purpose. Vite matches a proxy key as a plain prefix, so
  // "/dev-fonts" would also catch "/dev-fonts.css" and send the stylesheet
  // itself to the host, where it does not exist.
  "/dev-fonts/": {
    target: "https://dyalogprod.gos.dyalog.com",
    changeOrigin: true,
    rewrite: (path: string) =>
      path.replace(/^\/dev-fonts/, "/wp-content/uploads"),
  },
};

// The app is a client-side SPA embedded in a WordPress page: WordPress serves
// the HTML and mounts us into #dyalog-video-library. So the build must emit a
// single JS + single CSS under a stable path inside the WordPress theme.
export default defineConfig(({ mode }) => ({
  plugins: [svelte()],
  server: { proxy: fontProxy },
  preview: { proxy: fontProxy },
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
    // We distribute 2 files: dist/app.js and dist/style.css.
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
