// Grouping a sorted name list under its initials, for the presenter A-Z bar.

/** The letters the bar always offers. */
export const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];

/** Where a name starting with anything else goes. */
export const OTHER = "#";

export interface Group<T> {
  letter: string;
  items: T[];
}

/**
 * The letter a name belongs under. Diacritics are stripped, so Jørgen and Ólafur
 * group with J and O rather than under two letters of their own.
 */
export function initial(name: string): string {
  const first = name
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .charAt(0)
    .toUpperCase();

  return LETTERS.includes(first) ? first : OTHER;
}

/** The DOM id of a letter's section, and the anchor the bar links to. */
export function letterId(letter: string): string {
  return `presenters-${letter === OTHER ? "other" : letter}`;
}

/**
 * Groups an already sorted list, keeping it in the order given: the groups come
 * out in the order the sort produced them.
 */
export function groupByInitial<T>(
  items: T[],
  name: (item: T) => string,
): Group<T>[] {
  const groups: Group<T>[] = [];

  for (const item of items) {
    const letter = initial(name(item));
    const last = groups[groups.length - 1];

    if (last?.letter === letter) last.items.push(item);
    else groups.push({ letter, items: [item] });
  }

  return groups;
}
