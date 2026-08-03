import { apiPresenters } from "../env";
import { buildUrl, fetchJson } from "./client";
import { normalisePresenters, type RawPresenter } from "./normalise";
import type { Presenter } from "./types";

/** The roster of presenters: an id in a URL becomes a name through this. */
export async function listPresenters(): Promise<Presenter[]> {
  const url = buildUrl(apiPresenters);

  return normalisePresenters(await fetchJson<Partial<RawPresenter>[]>(url));
}
