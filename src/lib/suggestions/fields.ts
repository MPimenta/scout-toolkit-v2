export const SUGGESTABLE_FIELDS = [
  'name',
  'description',
  'materials',
  'approximate_duration_minutes',
  'group_size',
  'effort_level',
  'location',
  'age_group',
] as const;

export type SuggestableField = (typeof SUGGESTABLE_FIELDS)[number];

export function isSuggestableField(field: string): field is SuggestableField {
  return (SUGGESTABLE_FIELDS as readonly string[]).includes(field);
}
