// Which event kinds count as Dyalog's own, as opposed to the conferences and
// webinars it also publishes talks from. The roster carries fifteen kinds.

/** Named exactly. */
const OWN_TYPES = ["Dyalog User Meeting"];

/**
 * Matched by name, for the kinds that do not exist yet.
 *
 * No DYNA event has videos, so the API reports no kind for one and there is no
 * string to add to OWN_TYPES. Matching the name means whatever it turns out to
 * be called — "DYNA", "DYNA 2027", "DYNA Meeting" — qualifies the day it is
 * published, with no release needed.
 *
 * Bounded on both sides so "Dynamic" and the like do not slip through: the point
 * is to catch a kind we cannot yet name, not any word starting with those four
 * letters.
 */
const OWN_PATTERN = /\bdyna\b/i;

/**
 * APL Seeds, webinars and live streams are deliberately out: they are Dyalog's,
 * but they are not meetings, and "the last event" means a meeting.
 */
export function isOwnEvent(type: string): boolean {
  return OWN_TYPES.includes(type) || OWN_PATTERN.test(type);
}
