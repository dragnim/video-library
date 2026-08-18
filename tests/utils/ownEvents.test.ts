// The fifteen kinds the roster carries, and the one it does not carry yet.

import { describe, expect, it } from "vitest";
import { isOwnEvent } from "../../src/lib/utils/ownEvents";

describe("isOwnEvent", () => {
  it("takes a Dyalog user meeting", () => {
    expect(isOwnEvent("Dyalog User Meeting")).toBe(true);
  });

  // DYNA has no videos, so the API reports no kind for it and there is nothing
  // to match exactly. Whatever it ends up called, it should qualify unchanged.
  it.each(["DYNA", "DYNA 2027", "DYNA Meeting", "Dyalog DYNA", "dyna"])(
    "takes %s without knowing its name in advance",
    (type) => {
      expect(isOwnEvent(type)).toBe(true);
    },
  );

  it("is not fooled by a word that merely starts the same way", () => {
    expect(isOwnEvent("Dynamic Languages Symposium")).toBe(false);
  });

  // Dyalog's, but not meetings.
  it.each(["Dyalog Webinar", "Dyalog Live Stream", "APL Seeds User Meeting"])(
    "leaves out %s",
    (type) => {
      expect(isOwnEvent(type)).toBe(false);
    },
  );

  it.each([
    "APL Quest",
    "BAA Webinar",
    "BOB Konferenz",
    "Functional Conf",
    "Innovations in Compiler Technology",
    "LambdaConf",
    "PLDI",
    "PLSS",
    "Tacit Talk",
    "Talks at Google",
    "Tutorials",
  ])("leaves out %s", (type) => {
    expect(isOwnEvent(type)).toBe(false);
  });
});
