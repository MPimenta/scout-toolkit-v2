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
  'format_id',
  'focus_id',
  'secondary_focus_id',
] as const;

export type SuggestableField = (typeof SUGGESTABLE_FIELDS)[number];

export function isSuggestableField(field: string): field is SuggestableField {
  return (SUGGESTABLE_FIELDS as readonly string[]).includes(field);
}

/** Fields that hold a list of values; their suggested_value is stored as a JSON array string. */
export const CATEGORY_FIELDS = ['group_sizes', 'locations', 'age_groups'] as const;
export type CategoryField = (typeof CATEGORY_FIELDS)[number];

/** Fields that hold the id of a format or a focus; their suggested_value is that id. */
export const VALUE_FIELDS = ['format_id', 'focus_id', 'secondary_focus_id'] as const;
export type ValueField = (typeof VALUE_FIELDS)[number];

export function isValueField(field: string): field is ValueField {
  return (VALUE_FIELDS as readonly string[]).includes(field);
}

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
