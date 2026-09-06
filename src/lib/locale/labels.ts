import type { Translate } from '@/lib/locale/catalog';

const DURATION_OP: Record<string, 'gte' | 'lte' | 'eq'> = {
  '>=': 'gte',
  '<=': 'lte',
  '=': 'eq',
};

export function enumLabel(
  t: Translate,
  kind: 'groupSize' | 'effort' | 'location' | 'ageGroup',
  value: string
): string {
  const label = t(`enums.${kind}.${value}`);
  return label.startsWith('enums.') ? value : label;
}

export function durationOpLabel(t: Translate, value: string): string {
  return t(`enums.durationOp.${DURATION_OP[value] ?? 'gte'}`);
}
