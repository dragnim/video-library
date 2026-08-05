import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";

// Light TDD: we test core logic and data plumbing, not exhaustive markup.
export default defineConfig({
  plugins: [svelte(), svelteTesting()],
  // Mirror the build-time constant so components that read it work under test.
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  test: {
    globals: true,
    environment: "jsdom",
    // The integration tests render the whole app against MSW, and vitest runs
    // files in parallel: one takes a few hundred ms alone and several seconds
    // with 35 others competing for the same cores. High enough to absorb that,
    // low enough that a genuine hang still fails.
    testTimeout: 15000,
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    // Set variables here so tests never depends on .env* files
    // localhost:8081 is just a reference, not a server; MSW intercepts these URLs
    env: {
      VITE_API_VIDEOS: "http://localhost:8081/videos",
      VITE_API_EVENTS: "http://localhost:8081/events",
      VITE_API_PRESENTERS: "http://localhost:8081/presenters",
      VITE_BASENAME: "/",
      VITE_ASSETS_PREFIX: "/assets",
    },
  },
});
