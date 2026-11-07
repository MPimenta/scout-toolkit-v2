import type { Translate } from '@/lib/locale/catalog';

export function enumLabel(
  t: Translate,
  kind: 'groupSize' | 'effort' | 'location' | 'ageGroup',
  value: string
): string {
  const label = t(`enums.${kind}.${value}`);
  return label.startsWith('enums.') ? value : label;
}

/**
 * Labels for several values of one category, joined for display ("Interior, Exterior").
 * With `max`, only the first values are shown followed by "+k" for the rest.
 */
export function enumLabelList(
  t: Translate,
  kind: 'groupSize' | 'effort' | 'location' | 'ageGroup',
  values: readonly string[] | null | undefined,
  max?: number
): string {
  const list = values ?? [];
  const shown = max !== undefined && list.length > max ? list.slice(0, max) : list;
  const text = shown.map((value) => enumLabel(t, kind, value)).join(', ');
  return shown.length < list.length ? `${text} +${list.length - shown.length}` : text;
}

