/**
 * Video descriptions are plain text that authors write as if it were markup:
 * bare URLs, and `12:34` chapter marks meant to be clickable. This turns one
 * into paragraphs of tokens for a component to render.
 *
 * Replaces dvl's `react-process-string`, whose sequential rules meant each
 * rule re-scanned the text the earlier ones had left alone.
 */

export type DescriptionToken =
  | { kind: "text"; text: string }
  | { kind: "link"; text: string; href: string }
  /** Seconds into the video, for a `?time=` deep link. */
  | { kind: "timestamp"; text: string; seconds: number };

/**
 * Suffixes that make a bare `word.word` a web address. dvl linked any such
 * pair, which turned `array.reduce` and `dfns.dws` into dead links; a domain
 * with no scheme has to be recognised by its suffix or not at all.
 */
const TLDS = [
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "int",
  "io",
  "dev",
  "app",
  "ai",
  "me",
  "info",
  "tv",
  "quest",
  "wiki",
  "blog",
  "tech",
  "cloud",
  "online",
  "xyz",
  "ly",
  "eu",
  "uk",
  "de",
  "fr",
  "nl",
  "dk",
  "se",
  "no",
  "fi",
  "ch",
  "at",
  "es",
  "it",
  "pl",
  "cz",
  "jp",
  "cn",
  "au",
  "ca",
  "us",
];

/**
 * One pass, so the alternatives compete by position: a scheme'd URL claims a
 * `youtu.be/…?t=1:30` before the domain and timestamp rules see any of it.
 *
 * The timestamp guards reject a longer run of digits and colons, so `1234:56`
 * is a number rather than a time hidden inside one.
 */
const TOKEN = new RegExp(
  [
    `(?<url>https?:\\/\\/[^\\s<>]+)`,
    `(?<domain>[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9-]+)*\\.(?:${TLDS.join("|")})\\b(?:\\/[^\\s<>]*)?)`,
    `(?<![\\d:])(?<time>(?:(?<hours>[0-5]?\\d):)?(?<minutes>[0-5]?\\d):(?<seconds>[0-5]\\d))(?![\\d:])`,
  ].join("|"),
  "gi",
);

/** Sentence punctuation that follows an address rather than belonging to it. */
const TRAILING = /[.,;:!?)\]]+$/;

/**
 * Paragraphs, split on newlines, each a token list. An empty list is a blank
 * line: the caller decides what a gap between paragraphs looks like.
 */
export function descriptionParagraphs(
  description: string,
): DescriptionToken[][] {
  return description.split("\n").map(tokeniseParagraph);
}

function tokeniseParagraph(paragraph: string): DescriptionToken[] {
  const tokens: DescriptionToken[] = [];
  let cursor = 0;

  TOKEN.lastIndex = 0;

  for (
    let match = TOKEN.exec(paragraph);
    match !== null;
    match = TOKEN.exec(paragraph)
  ) {
    const groups = match.groups ?? {};
    const address = groups.url ?? groups.domain;
    // Trimming shortens the match, so the scan has to resume at the end of
    // what was kept or the punctuation is dropped instead of shown.
    const text =
      address === undefined ? match[0] : address.replace(TRAILING, "");
    if (text === "") continue;
    TOKEN.lastIndex = match.index + text.length;

    if (match.index > cursor) {
      tokens.push({ kind: "text", text: paragraph.slice(cursor, match.index) });
    }
    cursor = match.index + text.length;

    if (groups.url !== undefined) {
      // Displayed without the scheme, as dvl shows it.
      tokens.push({
        kind: "link",
        text: text.replace(/^https?:\/\//i, ""),
        href: text,
      });
    } else if (groups.domain !== undefined) {
      tokens.push({ kind: "link", text, href: `https://${text}` });
    } else {
      tokens.push({ kind: "timestamp", text, seconds: toSeconds(groups) });
    }
  }

  if (cursor < paragraph.length) {
    tokens.push({ kind: "text", text: paragraph.slice(cursor) });
  }

  return tokens;
}

/** `12:34` is minutes and seconds; the third field only appears with hours. */
function toSeconds(groups: Record<string, string | undefined>): number {
  return (
    Number(groups.hours ?? 0) * 3600 +
    Number(groups.minutes) * 60 +
    Number(groups.seconds)
  );
}
