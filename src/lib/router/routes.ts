import type { Component } from "svelte";
import Home from "../../routes/Home.svelte";
import Events from "../../components/browse/Events.svelte";
import Search from "../../routes/Search.svelte";

/**
 * Every route the app answers to. Flat: no nesting, no ranking, no path
 * params, because the URL carries all of the state in its query string.
 *
 * `/` is the de-facto catch-all — an unregistered path renders home. There is
 * no 404 route because WordPress owns 404s for the paths it does not rewrite
 * to us, so a path that reaches the app is one the site expects us to answer.
 */
export const routes: Record<string, Component> = {
  "/": Home,
  "/events": Events,
  "/search": Search,
};
