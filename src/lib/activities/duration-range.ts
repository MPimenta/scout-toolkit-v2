/** Optional minimum and maximum duration; whole minutes, the minimum not above the maximum. */
export function parseDurationRange(rawMin: unknown, rawMax: unknown): { min: number | null; max: number | null } | string {
  const parse = (raw: unknown): number | null | 'invalid' => {
    if (raw === undefined || raw === null || raw === '') return null;
    const value = Number(raw);
    return Number.isInteger(value) && value >= 1 ? value : 'invalid';
  };
  const min = parse(rawMin);
  const max = parse(rawMax);
  if (min === 'invalid' || max === 'invalid') return 'Duração mínima ou máxima inválida';
  if (min !== null && max !== null && min > max) return 'A duração mínima não pode exceder a máxima';
  return { min, max };
}

/**
 * "20–40 min" when the activity has a range, "30 min" otherwise. The program builder keeps using
 * the single value; this is only for lists and the detail page.
 */
export function formatDuration(single: number, min?: number | null, max?: number | null): string {
  if (min && max && min !== max) return `${min}–${max} min`;
  return `${single} min`;
}
