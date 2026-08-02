import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { checkThemeTokens } from "./lib/themeTokens";

// Expose the build version the same way dvl does, for support/debugging.
window.DyalogVideoLibrary = { version: __APP_VERSION__ };

const target = document.getElementById("dyalog-video-library");
if (!target) {
  throw new Error("Mount target #dyalog-video-library not found");
}

const app = mount(App, { target });

checkThemeTokens();

export default app;
