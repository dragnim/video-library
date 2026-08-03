/**
 * Month and year, as the cards show it. The locale is fixed: dvl read
 * `navigator.language` in one of its three implementations, so one page could
 * render two locales on a site written in English.
 */
export function formatDate(date: Date | null, month: "short" | "long"): string {
  if (date === null) return "";

  return date.toLocaleDateString("en-GB", { month, year: "numeric" });
}
