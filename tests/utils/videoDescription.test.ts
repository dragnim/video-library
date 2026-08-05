// What a description turns into: which spans become links, which become
// chapter marks, and what stays plain text.

import { describe, expect, it } from "vitest";
import {
  descriptionParagraphs,
  type DescriptionToken,
} from "../../src/lib/utils/videoDescription";

/** The only paragraph, for the single-line cases. */
function tokens(description: string): DescriptionToken[] {
  const paragraphs = descriptionParagraphs(description);
  expect(paragraphs).toHaveLength(1);
  return paragraphs[0];
}

describe("paragraphs", () => {
  it("splits on newlines", () => {
    const paragraphs = descriptionParagraphs("first\nsecond");

    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toEqual([{ kind: "text", text: "first" }]);
    expect(paragraphs[1]).toEqual([{ kind: "text", text: "second" }]);
  });

  it("gives a blank line no tokens", () => {
    expect(descriptionParagraphs("first\n\nsecond")[1]).toEqual([]);
  });

  it("returns one empty paragraph for an empty description", () => {
    expect(descriptionParagraphs("")).toEqual([[]]);
  });
});

describe("URLs", () => {
  it("links a scheme'd URL, displayed without the scheme", () => {
    expect(tokens("see https://dyalog.com/docs for more")).toEqual([
      { kind: "text", text: "see " },
      {
        kind: "link",
        text: "dyalog.com/docs",
        href: "https://dyalog.com/docs",
      },
      { kind: "text", text: " for more" },
    ]);
  });

  it("leaves a full stop after a URL out of the link", () => {
    expect(tokens("at https://dyalog.com.")).toEqual([
      { kind: "text", text: "at " },
      { kind: "link", text: "dyalog.com", href: "https://dyalog.com" },
      { kind: "text", text: "." },
    ]);
  });

  it("links a bare domain over https", () => {
    expect(tokens("see dyalog.com")).toEqual([
      { kind: "text", text: "see " },
      { kind: "link", text: "dyalog.com", href: "https://dyalog.com" },
    ]);
  });

  it("links a bare domain with a path", () => {
    expect(tokens("aplwiki.com/wiki/Dfn")).toEqual([
      {
        kind: "link",
        text: "aplwiki.com/wiki/Dfn",
        href: "https://aplwiki.com/wiki/Dfn",
      },
    ]);
  });

  it("links a subdomain", () => {
    expect(tokens("try help.dyalog.com")).toEqual([
      { kind: "text", text: "try " },
      {
        kind: "link",
        text: "help.dyalog.com",
        href: "https://help.dyalog.com",
      },
    ]);
  });

  // The rule dvl got wrong: any `word.word` became a link.
  it.each(["array.reduce", "dfns.dws", "setup.py", "main.svelte", "a.b"])(
    "leaves %s as plain text",
    (text) => {
      expect(tokens(`call ${text} here`)).toEqual([
        { kind: "text", text: `call ${text} here` },
      ]);
    },
  );

  it("does not mistake a longer word for a known suffix", () => {
    expect(tokens("the dyalog.community forum")).toEqual([
      { kind: "text", text: "the dyalog.community forum" },
    ]);
  });

  it("does not re-scan inside a URL it has already claimed", () => {
    expect(tokens("https://youtu.be/abc?t=1:30")).toEqual([
      {
        kind: "link",
        text: "youtu.be/abc?t=1:30",
        href: "https://youtu.be/abc?t=1:30",
      },
    ]);
  });
});

describe("timestamps", () => {
  it("reads minutes and seconds", () => {
    expect(tokens("intro 8:55 ends")).toEqual([
      { kind: "text", text: "intro " },
      { kind: "timestamp", text: "8:55", seconds: 535 },
      { kind: "text", text: " ends" },
    ]);
  });

  it("reads hours, minutes and seconds", () => {
    expect(tokens("1:02:03")).toEqual([
      { kind: "timestamp", text: "1:02:03", seconds: 3723 },
    ]);
  });

  it("counts a leading zero minute", () => {
    expect(tokens("0:07")).toEqual([
      { kind: "timestamp", text: "0:07", seconds: 7 },
    ]);
  });

  it("leaves a longer run of digits alone rather than finding a time inside it", () => {
    expect(tokens("build 1234:56 done")).toEqual([
      { kind: "text", text: "build 1234:56 done" },
    ]);
  });

  it("rejects a seconds field over 59", () => {
    expect(tokens("12:75")).toEqual([{ kind: "text", text: "12:75" }]);
  });

  it("finds every mark in a chapter list", () => {
    const marks = descriptionParagraphs("0:00 Intro\n2:30 Dfns\n15:04 Q&A").map(
      (paragraph) => paragraph[0],
    );

    expect(marks).toEqual([
      { kind: "timestamp", text: "0:00", seconds: 0 },
      { kind: "timestamp", text: "2:30", seconds: 150 },
      { kind: "timestamp", text: "15:04", seconds: 904 },
    ]);
  });
});
