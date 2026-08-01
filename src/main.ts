import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

// Expose the build version the same way dvl does, for support/debugging.
window.DyalogVideoLibrary = { version: __APP_VERSION__ };

const target = document.getElementById("dyalog-video-library");
if (!target) {
  throw new Error("Mount target #dyalog-video-library not found");
}

const app = mount(App, { target });

export default app;
