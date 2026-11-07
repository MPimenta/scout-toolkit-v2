import { describe, expect, it } from 'vitest';
import {
  isCategoryField,
  isSuggestableField,
  parseCategoryValue,
  SUGGESTABLE_FIELDS,
} from '@/lib/suggestions/fields';

describe('suggestion fields', () => {
  it('accepts catalogue scalar fields', () => {
    expect(isSuggestableField('description')).toBe(true);
    expect(SUGGESTABLE_FIELDS).toContain('materials');
    expect(isSuggestableField('instructions')).toBe(true);
  });

  it('rejects unknown fields, including the old single-valued names', () => {
    expect(isSuggestableField('activity_type_id')).toBe(false);
    expect(isSuggestableField('age_group')).toBe(false);
    expect(isSuggestableField('location')).toBe(false);
    expect(isSuggestableField('group_size')).toBe(false);
  });

  it('accepts the four list fields and flags them as category fields', () => {
    for (const field of ['group_sizes', 'locations', 'age_groups', 'activity_types']) {
      expect(isSuggestableField(field)).toBe(true);
      expect(isCategoryField(field)).toBe(true);
    }
    expect(isCategoryField('description')).toBe(false);
  });

  it('reads stored list values and tolerates malformed ones', () => {
    expect(parseCategoryValue('["scouts","rovers"]')).toEqual(['scouts', 'rovers']);
    expect(parseCategoryValue('scouts')).toEqual([]);
    expect(parseCategoryValue('{"a":1}')).toEqual([]);
  });
});
