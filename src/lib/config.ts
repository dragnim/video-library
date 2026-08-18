// Reads window.DYALOG_VIDEO_CONFIG, set by dist/config.js. That file is
// hand-edited on the server and never compiled, so nothing here is trusted.

/** The featured strip's editorial state. */
export interface FeaturedConfig {
  hero: string;
  heroEyebrow: string;
  secondaryIds: string[];
}

const defaults: FeaturedConfig = {
  // No placeholder ids: dvl's pointed at content that need not exist, and the
  // strip rendered empty under a hardcoded heading.
  hero: "",
  heroEyebrow: "",
  secondaryIds: [],
};

/** The layout has one card beside the hero. */
const SECONDARY_SLOTS = 1;

/**
 * `eventSlug` is read only to say it is no longer read.
 *
 * The event card names the last of Dyalog's own meetings, worked out from the
 * videos, so pinning one by hand would let the label lie. Kept in the known keys
 * so a config that still carries it gets told why it stopped mattering, rather
 * than an unhelpful "unknown key".
 */
const RETIRED_KEYS = ["eventSlug"];

const FEATURED_KEYS = [...Object.keys(defaults), ...RETIRED_KEYS];

function warn(message: string): void {
  console.warn(`DYALOG_VIDEO_CONFIG: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** So a typo in a hand-edited file surfaces. */
function warnUnknownKeys(
  value: Record<string, unknown>,
  known: string[],
  where: string,
): void {
  for (const key of Object.keys(value)) {
    if (!known.includes(key)) warn(`unknown key ${where}${key}`);
  }
}

function readString(value: unknown, key: string, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string") {
    warn(`featured.${key} must be a string, ignoring`);
    return fallback;
  }
  return value.trim();
}

function readSecondaryIds(value: unknown): string[] {
  if (value === undefined) return defaults.secondaryIds;
  if (!Array.isArray(value)) {
    warn("featured.secondaryIds must be an array, ignoring");
    return defaults.secondaryIds;
  }

  const ids = value.filter((id): id is string => {
    if (typeof id === "string") return true;
    warn("featured.secondaryIds contains a non-string, ignoring it");
    return false;
  });

  if (ids.length > SECONDARY_SLOTS) {
    warn(
      `featured.secondaryIds has ${ids.length} ids, only the first ${SECONDARY_SLOTS} are shown`,
    );
  }
  return ids.slice(0, SECONDARY_SLOTS).map((id) => id.trim());
}

/**
 * Merges field by field, so a partial `featured` block keeps its siblings.
 * dvl's shallow spread let `{ featured: { hero } }` drop everything else.
 *
 * @returns null with no hero, so the caller can fall back.
 */
export function parseConfig(raw: unknown): FeaturedConfig | null {
  if (raw === undefined || raw === null) return null;
  if (!isRecord(raw)) {
    warn("expected an object, ignoring");
    return null;
  }

  warnUnknownKeys(raw, ["featured"], "");

  const { featured } = raw;
  if (featured === undefined) return null;
  if (!isRecord(featured)) {
    warn("featured must be an object, ignoring");
    return null;
  }

  warnUnknownKeys(featured, FEATURED_KEYS, "featured.");

  const hero = readString(featured.hero, "hero", defaults.hero);
  if (hero === "") return null;

  if (featured.eventSlug !== undefined) {
    warn(
      "featured.eventSlug is no longer used: the event card names the last " +
        "Dyalog meeting, taken from the videos. It can be removed.",
    );
  }

  return {
    hero,
    heroEyebrow: readString(
      featured.heroEyebrow,
      "heroEyebrow",
      defaults.heroEyebrow,
    ),
    secondaryIds: readSecondaryIds(featured.secondaryIds),
  };
}

// Read at module evaluation: config.js has already run by then.
export const featuredConfig: FeaturedConfig | null =
  typeof window === "undefined"
    ? null
    : parseConfig(window.DYALOG_VIDEO_CONFIG);
