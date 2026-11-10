import { describe, expect, it } from 'vitest';
import { activityKindLabel, activityKindParts } from '@/lib/activities/kind-label';

const jogo = { name: 'Jogo' };
const cooperacao = { name: 'Cooperação' };
const lideranca = { name: 'Liderança' };

describe('activityKindLabel', () => {
  it('reads format, main focus and (when asked) secondary focus in that order', () => {
    const activity = { format: jogo, focus: cooperacao, secondary_focus: lideranca };
    expect(activityKindLabel(activity)).toBe('Jogo · Cooperação');
    expect(activityKindLabel(activity, { secondary: true })).toBe('Jogo · Cooperação · Liderança');
  });

  it('leaves out what the activity does not have', () => {
    expect(activityKindLabel({ format: jogo })).toBe('Jogo');
    expect(activityKindLabel({ format: jogo, secondary_focus: lideranca }, { secondary: true })).toBe('Jogo · Liderança');
    expect(activityKindLabel({ focus: cooperacao })).toBe('Cooperação');
  });

  it('is empty, not a placeholder, when there is neither a format nor a focus', () => {
    expect(activityKindLabel({})).toBe('');
    expect(activityKindLabel({ format: null, focus: null, secondary_focus: null }, { secondary: true })).toBe('');
    expect(activityKindParts({ format: null })).toEqual([]);
  });
});
