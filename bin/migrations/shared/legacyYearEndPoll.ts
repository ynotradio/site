type CategoryType = 'songs' | 'albums' | 'artists' | 'concerts' | 'custom';

interface KnownCategory {
  slug: string;
  displayName: string;
  categoryType: CategoryType;
  maxPicks: number;
  requiredForContest: boolean;
}

/** A legacy category row is artist/title, artist, title or concert, depending on the table. */
export const legacyNomineeLabel = (row: Record<string, unknown>): string => {
  const text = (key: string) => String(row[key] ?? '').trim();
  return [text('artist'), text('title'), text('concert')].filter(Boolean).join(' - ');
};

/**
 * Settings for a legacy category table from the known category list, or null
 * for a table that isn't on it (old categories such as late_night_tv). Years
 * in the display name are shifted from the list's poll year to the imported
 * one ("Most Anticipated Albums of 2027" on the 2026 list becomes "of 2026"
 * for a 2025 poll).
 */
export const legacyCategory = (
  slug: string,
  year: number,
  known: { year: number; categories: readonly KnownCategory[] },
): KnownCategory | null => {
  const match = known.categories.find((category) => category.slug === slug);
  if (!match) return null;
  return {
    slug: match.slug,
    displayName: match.displayName.replace(/\b20\d\d\b/, (found) => String(Number(found) - known.year + year)),
    categoryType: match.categoryType,
    maxPicks: match.maxPicks,
    requiredForContest: match.requiredForContest,
  };
};
