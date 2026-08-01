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
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
  },
});
