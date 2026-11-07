export const SUGGESTABLE_FIELDS = [
  'name',
  'description',
  'materials',
  'instructions',
  'approximate_duration_minutes',
  'group_sizes',
  'effort_level',
  'locations',
  'age_groups',
  'activity_types',
] as const;

export type SuggestableField = (typeof SUGGESTABLE_FIELDS)[number];

export function isSuggestableField(field: string): field is SuggestableField {
  return (SUGGESTABLE_FIELDS as readonly string[]).includes(field);
}

/** Fields that hold a list of values; their suggested_value is stored as a JSON array string. */
export const CATEGORY_FIELDS = ['group_sizes', 'locations', 'age_groups', 'activity_types'] as const;
export type CategoryField = (typeof CATEGORY_FIELDS)[number];

export function isCategoryField(field: string): field is CategoryField {
  return (CATEGORY_FIELDS as readonly string[]).includes(field);
}

/** Reads a stored category suggestion back into a list (empty when malformed). */
export function parseCategoryValue(stored: string): string[] {
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}
