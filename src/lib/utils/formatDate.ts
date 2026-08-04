/**
 * Month and year, as the cards show it. The locale is fixed: dvl read
 * `navigator.language` in one of its three implementations, so one page could
 * render two locales on a site written in English.
 */
export function formatDate(date: Date | null, month: "short" | "long"): string {
  if (date === null) return "";

  return date.toLocaleDateString("en-GB", { month, year: "numeric" });
}

/**
 * An event's span. Collapses to one label when both ends fall in the same month,
 * which is where most events sit.
 */
export function formatDateRange(
  from: Date | null,
  to: Date | null,
  month: "short" | "long",
): string {
  const start = formatDate(from, month);
  const end = formatDate(to, month);

  if (start === end) return start;
  if (start === "" || end === "") return start || end;

  return `${start} to ${end}`;
}
