import { describe, expect, it } from 'vitest';
import { isSuggestableField, SUGGESTABLE_FIELDS } from '@/lib/suggestions/fields';

describe('suggestion fields', () => {
  it('accepts catalogue scalar fields', () => {
    expect(isSuggestableField('description')).toBe(true);
    expect(SUGGESTABLE_FIELDS).toContain('materials');
  });

  it('rejects unknown fields', () => {
    expect(isSuggestableField('activity_type_id')).toBe(false);
  });
});
