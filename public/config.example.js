/*
 * Reference copy of dist/config.js, the video library's runtime configuration.
 * Edit it on the server and refresh.
 *
 * Every field is optional. With no hero the front page falls back to the newest
 * videos. Typos and surplus secondary ids are reported in the browser console.
 *
 * There is no eventSlug: the event card names the last of Dyalog's own meetings,
 * worked out from the videos, so it needs no upkeep after a conference.
 */
window.DYALOG_VIDEO_CONFIG = {
  featured: {
    // The large slot.
    hero: "6tkUO7Wc5Tg",
    // Label above the hero title.
    heroEyebrow: "Featured Video",
    // The card beside the hero. One slot; extra ids are reported and ignored.
    secondaryIds: ["iC9floP7POU"],
  },
};
