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

/** A row of dashes an author typed as a horizontal rule. */
const FENCE = /^[ \t]*-{5,}[ \t]*$/;

/**
 * How the promotional block opens.
 *
 * Keyed on the wording rather than the fence: 245 descriptions carry a dashed
 * line and only 214 of them are this block. The others use one as an ordinary
 * separator — "Slides : https://…" sits after one — and cutting on the dashes
 * alone would take real content with it.
 *
 * A wording that has not appeared yet will not be stripped, which is the right
 * way round: the block stays visible until someone adds it here, rather than an
 * over-eager pattern quietly eating a description.
 */
const BOILERPLATE = [/^GET STARTED\b/i];

/** A closing line of nothing but hashtags, which the block signs off with. */
const HASHTAGS = /^(?:#[^\s#]+[ \t]*)+$/;

/**
 * Drops the promotional block Dyalog appends to a video before publishing it.
 *
 * It is fenced by dashed lines and followed by a line of hashtags, so the shape
 * is: rule, block, rule, hashtags. Only the fenced section whose first line is
 * recognised goes, and the hashtags only if nothing but hashtags follow — a
 * description ending in real prose keeps it.
 *
 * Worth saying plainly: this edits what an author wrote, and it will need
 * revisiting when the wording of the block changes. The durable fix is for the
 * text not to arrive with it.
 */
export function withoutBoilerplate(description: string): string {
  const lines = description.split("\n");

  const opening = lines.findIndex((line) => FENCE.test(line));
  if (opening === -1) return description;

  const closing = lines.findIndex(
    (line, index) => index > opening && FENCE.test(line),
  );
  if (closing === -1) return description;

  const fenced = lines
    .slice(opening + 1, closing)
    .join("\n")
    .trim();
  if (!BOILERPLATE.some((opener) => opener.test(fenced))) return description;

  const after = lines.slice(closing + 1);
  const signature = after.every(
    (line) => line.trim() === "" || HASHTAGS.test(line.trim()),
  );

  const kept = signature
    ? lines.slice(0, opening)
    : [...lines.slice(0, opening), ...after];

  // Trailing blank lines would render as the gaps the author never asked for.
  while (kept.length > 0 && kept[kept.length - 1].trim() === "") kept.pop();

  return kept.join("\n");
}

/**
 * A line an author meant as a list item.
 *
 * One marker and a space: authors type bullets as characters, and the marker is
 * the only thing distinguishing an item from a sentence that happens to start
 * with a dash. `-5 degrees` is not an item; `- five degrees` is.
 */
const BULLET = /^\s*([•·‣▪–—*-])\s+(?=\S)/;

export type DescriptionBlock =
  /** A blank line the author left, kept as the gap they intended. */
  | { kind: "break" }
  | { kind: "paragraph"; tokens: DescriptionToken[] }
  /** A run of adjacent item lines, as one list. */
  | { kind: "list"; items: DescriptionToken[][] };

/**
 * Groups the lines into what the author was drawing.
 *
 * Descriptions are plain text, so a list is a run of lines each opening with a
 * bullet character. Rendering them as the paragraphs they technically are leaves
 * the markers hanging in the left margin with no indent behind them; recognising
 * the run lets the list carry its own markers and hang its own text.
 *
 * The marker itself is dropped: it is punctuation the author had to type because
 * plain text gave them no other way to say "list".
 */
export function descriptionBlocks(description: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];

  for (const line of withoutBoilerplate(description).split("\n")) {
    const bullet = BULLET.exec(line);

    if (bullet === null) {
      const tokens = tokeniseParagraph(line);
      blocks.push(
        tokens.length === 0 ? { kind: "break" } : { kind: "paragraph", tokens },
      );
      continue;
    }

    const item = tokeniseParagraph(line.slice(bullet[0].length));
    // Indexed rather than .at(-1): the app targets a library that predates it.
    const last = blocks[blocks.length - 1];

    if (last !== undefined && last.kind === "list") last.items.push(item);
    else blocks.push({ kind: "list", items: [item] });
  }

  return blocks;
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
