import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier/flat";
import svelteConfig from "./svelte.config.js";

export default tseslint.config(
  { ignores: ["build/", "node_modules/"] },

  js.configs.recommended,
  tseslint.configs.recommended,
  svelte.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
  },

  {
    // `svelte/valid-compile` shows Svelte compiler's warnings as lint results.
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        // Needed for TypeScript inside <script lang="ts">, and so the parser
        // applies the same preprocessors the build does.
        parser: tseslint.parser,
        svelteConfig,
      },
    },
    rules: {
      "svelte/valid-compile": "error",
    },
  },

  {
    files: ["*.config.{js,ts}", "tests/**/*.ts"],
    languageOptions: { globals: globals.node },
  },

  // Must come last: turn off rules Prettier already handles to avoid conflicts.
  prettier,
  svelte.configs.prettier,
);
