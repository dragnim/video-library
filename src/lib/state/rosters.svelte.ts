// Presenters and events, loaded once. The URL and the API carry presenter ids;
// everything the user reads carries names, and this is the join.

import { listEvents } from "../api/events";
import { listPresenters } from "../api/presenters";
import type { DyalogEvent, Presenter } from "../api/types";

export type RosterStatus = "loading" | "loaded" | "failed";

let status = $state<RosterStatus>("loading");
let presenters = $state.raw<Presenter[]>([]);
let events = $state.raw<DyalogEvent[]>([]);

const namesById = $derived(new Map(presenters.map((p) => [p.id, p.name])));
const eventsBySlug = $derived(new Map(events.map((e) => [e.shortname, e])));

export const rosters = {
  /**
   * `failed` still serves whichever roster arrived. Consumers branch on
   * `loading` to tell an id that has not resolved yet from one that never will.
   */
  get status(): RosterStatus {
    return status;
  },

  get presenters(): Presenter[] {
    return presenters;
  },

  get events(): DyalogEvent[] {
    return events;
  },

  /**
   * `undefined` for an id the roster does not carry. An unknown id still
   * filters the API correctly, so it keeps its place in the URL and the UI
   * decides what to show for it.
   */
  presenterName(id: number): string | undefined {
    return namesById.get(id);
  },

  /** By slug, which is what `?event=` carries. */
  event(shortname: string): DyalogEvent | undefined {
    return eventsBySlug.get(shortname);
  },
};

let started = false;

/**
 * Called once at init. A failure leaves the app usable with ids unresolved
 * rather than blocking on a roster nothing strictly needs.
 */
export function loadRosters(): void {
  if (started) return;
  started = true;

  void load();
}

async function load(): Promise<void> {
  // Settled separately, so a failed presenter roster still leaves the event
  // menu with something to show.
  const [loadedPresenters, loadedEvents] = await Promise.allSettled([
    listPresenters(),
    listEvents(),
  ]);

  if (loadedPresenters.status === "fulfilled") {
    presenters = loadedPresenters.value;
  }
  if (loadedEvents.status === "fulfilled") {
    events = loadedEvents.value;
  }

  const failures = [loadedPresenters, loadedEvents].filter(
    (result) => result.status === "rejected",
  );

  status = failures.length === 0 ? "loaded" : "failed";

  for (const failure of failures) {
    console.warn(`Roster failed to load: ${String(failure.reason)}`);
  }
}
