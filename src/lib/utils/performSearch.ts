import type { Presenter } from "../api/types";
import { DEFAULT_FILTERS, serialiseFilters } from "./browseFilters";

/** A field as the form exposes it. */
interface FormMember {
  name: string;
  value: string;
}

/**
 * A submit event, or the fields themselves. The second form is how the
 * advanced-search panel calls this, and has no caller yet.
 */
type Trigger = SubmitEvent | (Iterable<FormMember> & { target: "" });

/** Only the url form is used, so callers can pass `navigate` directly. */
type Navigate = (url: string) => void;

/**
 * Values of every field named `nameToFind`: the string when there is one, the
 * array when a form has several, null when it has none. `ao-presenters[]` is
 * always an array, since one selected presenter is still a list.
 */
function filterQuery(
  members: Iterable<FormMember>,
  nameToFind: string,
): string | string[] | null {
  const found: string[] = [];
  for (const member of members) {
    if (member.name === nameToFind) found.push(member.value);
  }

  if (found.length === 0) return null;
  if (found.length === 1 && nameToFind !== "ao-presenters[]") return found[0];
  return found;
}

/**
 * Joining the array preserves what the query serialiser produced ("a,b");
 * dropping it would be the wrong failure mode. Only one `q` and one `ao-event`
 * exist today, so the array branch is latent.
 */
function asString(value: string | string[] | null): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.join(",");
  return "";
}

function asList(value: string | string[] | null): string[] {
  if (value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * @param navigate where the result lands
 * @param targetPath defaults to /search, which is what every existing caller
 *   wants; browse pages pass their own path so the Search button and the Sort
 *   control do not navigate off the page they are on.
 */
export function performSearch(navigate: Navigate, targetPath = "/search") {
  return (
    trigger: Trigger,
    presenters: Presenter[] = [],
    startValue = "",
    endValue = "",
    sortOrder = "",
  ): void => {
    if ("preventDefault" in trigger) trigger.preventDefault();
    const isElement = trigger.target === "";
    const members = (
      isElement ? trigger : (trigger as SubmitEvent).target
    ) as Iterable<FormMember>;

    const targetQ = asString(filterQuery(members, "q"));
    const paginate = filterQuery(members, "ao-pagination");
    const eventName = asString(filterQuery(members, "ao-event"));

    // Called from the panel rather than on submit, the inputs have not been
    // rendered and their values are null, so the panel passes its state in.
    const targetFrom = isElement
      ? startValue
      : filterQuery(members, "ao-daterange-from");
    const targetTo = isElement
      ? endValue
      : filterQuery(members, "ao-daterange-to");
    const targetPresenters = isElement
      ? presenters.map((p) => String(p.id))
      : filterQuery(members, "ao-presenters[]");
    const targetSort = isElement
      ? sortOrder
      : filterQuery(members, "ao-sort-by");

    const params = serialiseFilters({
      q: targetQ,
      page: 1,
      from: asString(targetFrom),
      to: asString(targetTo),
      presenterIds: asList(targetPresenters)
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id)),
      sort: asString(targetSort) || DEFAULT_FILTERS.sort,
      // The panel's own Per Page select, falling back to the shared default
      // rather than a second hardcoded 20.
      perpage: Number(paginate) || DEFAULT_FILTERS.perpage,
      event: eventName !== "Any" ? eventName : "",
    });

    navigate(`${targetPath}?${params.toString()}`);
  };
}
