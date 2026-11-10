import {
  AGE_GROUP_VALUES,
  GROUP_SIZE_VALUES,
  LOCATION_VALUES,
  type AgeGroupValue,
  type GroupSizeValue,
  type LocationValue,
} from './category-values';

/**
 * Pure parsing helpers for loading the curated activities sheet.
 * Nothing here touches the database or the file system.
 */

const PLACEHOLDERS = new Set(['', '-', '–', '—', 'n/a', 'na', 'nenhum', 'nao se aplica']);

/** Lower-case, accent-free, single-spaced text used for comparisons. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** True for empty cells and the sheet's "-" style placeholders. */
export function isPlaceholder(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return PLACEHOLDERS.has(normalizeText(String(value)));
}

/** Header names are compared without accents, case or punctuation ("Intruções?" → "intrucoes"). */
export function normalizeHeader(header: string): string {
  return normalizeText(header)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export type DurationResult =
  | { ok: true; minutes: number; note?: string }
  | { ok: false; reason: string };

/**
 * "30", "15-30", "20/30 min", "20min", "1h", "1h30", "1,5 h" → integer minutes.
 * Ranges use the upper bound; the note records that a range was collapsed.
 */
export function parseDuration(raw: unknown): DurationResult {
  if (isPlaceholder(raw)) return { ok: false, reason: 'duração em falta' };
  const text = normalizeText(String(raw)).replace(',', '.');

  const hours = /^(\d+(?:\.\d+)?)\s*h(?:oras?)?\s*(?:(\d+)\s*(?:m|min|minutos?)?)?$/.exec(text);
  if (hours) {
    const minutes = Math.round(Number(hours[1]) * 60 + (hours[2] ? Number(hours[2]) : 0));
    return minutes > 0 ? { ok: true, minutes } : { ok: false, reason: 'duração inválida' };
  }

  const range = /^(\d+)\s*[-–/]\s*(\d+)\s*(?:m|min|minutos?)?$/.exec(text);
  if (range) {
    const upper = Math.max(Number(range[1]), Number(range[2]));
    return upper > 0
      ? { ok: true, minutes: upper, note: `intervalo ${String(raw).trim()} → ${upper} min` }
      : { ok: false, reason: 'duração inválida' };
  }

  const single = /^(\d+)\s*(?:m|min|minutos?)?$/.exec(text);
  if (single) {
    const minutes = Number(single[1]);
    return minutes > 0 ? { ok: true, minutes } : { ok: false, reason: 'duração inválida' };
  }
  return { ok: false, reason: `duração não reconhecida: "${String(raw).trim()}"` };
}

/** Splits a multi-valued cell on commas, semicolons and line breaks; placeholders disappear. */
export function splitList(raw: unknown): string[] {
  if (isPlaceholder(raw)) return [];
  return String(raw)
    .split(/[,;\n]+/)
    .map((part) => part.trim())
    .filter((part) => !isPlaceholder(part));
}

export type MappedList<T> = { values: T[]; dropped: string[] };

function mapEach<T>(raw: unknown, resolve: (normalized: string) => T | null): MappedList<T> {
  const values: T[] = [];
  const dropped: string[] = [];
  for (const item of splitList(raw)) {
    const mapped = resolve(normalizeText(item));
    if (mapped === null) dropped.push(item);
    else if (!values.includes(mapped)) values.push(mapped);
  }
  return { values, dropped };
}

/** Leading word of a label such as "Médio (7-15)" → "medio". */
function firstWord(normalized: string): string {
  return normalized.split(/[\s(]/)[0] ?? normalized;
}

const GROUP_ALIASES: Record<string, GroupSizeValue> = {
  pequeno: 'small',
  pequena: 'small',
  medio: 'medium',
  media: 'medium',
  grande: 'large',
};

export function mapGroupSizes(raw: unknown): MappedList<GroupSizeValue> {
  return mapEach(raw, (n) => {
    if ((GROUP_SIZE_VALUES as readonly string[]).includes(n)) return n as GroupSizeValue;
    return GROUP_ALIASES[firstWord(n)] ?? null;
  });
}

const LOCATION_ALIASES: Record<string, LocationValue[]> = {
  interior: ['inside'],
  exterior: ['outside'],
  dentro: ['inside'],
  fora: ['outside'],
  ambos: ['inside', 'outside'],
};

export function mapLocations(raw: unknown): MappedList<LocationValue> {
  const values: LocationValue[] = [];
  const dropped: string[] = [];
  for (const item of splitList(raw)) {
    const n = normalizeText(item);
    const hit = (LOCATION_VALUES as readonly string[]).includes(n)
      ? [n as LocationValue]
      : LOCATION_ALIASES[firstWord(n)];
    if (!hit) dropped.push(item);
    else for (const value of hit) if (!values.includes(value)) values.push(value);
  }
  return { values, dropped };
}

// Divisions, as in the reference sheet: Lobitos (Alcateia) 6-10, Escoteiros (Tropa) 10-14, Exploradores (Esquadra) 14-17 (alias Pioneiros), Caminheiros (Clã) 17-21, Dirigentes 21+.
const AGE_ALIASES: Record<string, AgeGroupValue> = {
  lobito: 'cub_scouts',
  lobitos: 'cub_scouts',
  explorador: 'adventurers',
  exploradores: 'adventurers',
  escoteiro: 'scouts',
  escoteiros: 'scouts',
  pioneiro: 'adventurers',
  pioneiros: 'adventurers',
  caminheiro: 'rovers',
  caminheiros: 'rovers',
  dirigente: 'leaders',
  dirigentes: 'leaders',
};

export function mapAgeGroups(raw: unknown): MappedList<AgeGroupValue> {
  return mapEach(raw, (n) => {
    if ((AGE_GROUP_VALUES as readonly string[]).includes(n)) return n as AgeGroupValue;
    return AGE_ALIASES[firstWord(n)] ?? null;
  });
}

export type EffortValue = 'low' | 'medium' | 'high';

const EFFORT_ALIASES: Record<string, EffortValue> = {
  baixo: 'low',
  baixa: 'low',
  low: 'low',
  medio: 'medium',
  media: 'medium',
  medium: 'medium',
  alto: 'high',
  alta: 'high',
  high: 'high',
};

/** Effort is single-valued; with several values the first recognised one wins. */
export function mapEffort(raw: unknown): { value: EffortValue | null; dropped: string[] } {
  const items = splitList(raw);
  let value: EffortValue | null = null;
  const dropped: string[] = [];
  for (const item of items) {
    const hit = EFFORT_ALIASES[firstWord(normalizeText(item))];
    if (hit && !value) value = hit;
    else dropped.push(item);
  }
  return { value, dropped };
}

export type NamedRef = { id: string; name: string; code?: string };

/**
 * A single-valued reference cell (format, focus): matched by name or code, never created.
 * An empty cell is not an error here; an unknown value is returned in `dropped`.
 */
export function mapNamedValue(raw: unknown, refs: readonly NamedRef[]): { id: string | null; dropped: string[] } {
  if (isPlaceholder(raw)) return { id: null, dropped: [] };
  const wanted = normalizeText(String(raw));
  const hit = refs.find((ref) => normalizeText(ref.name) === wanted || (ref.code !== undefined && normalizeText(ref.code) === wanted));
  return hit ? { id: hit.id, dropped: [] } : { id: null, dropped: [String(raw).trim()] };
}

/** TRUE / FALSE cells (also sim / não, 1 / 0). Anything else, including empty, counts as not published. */
export function parseBoolean(raw: unknown): boolean {
  return ['true', 'verdadeiro', 'sim', 's', '1'].includes(normalizeText(String(raw ?? '')));
}

export type TypeRef = { id: string; name: string };

/** Matches type names to existing activity types (never creates new ones). */
export function mapActivityTypes(raw: unknown, types: readonly TypeRef[]): MappedList<string> {
  const byName = new Map(types.map((type) => [normalizeText(type.name), type.id]));
  return mapEach(raw, (n) => byName.get(n) ?? null);
}

export type SdgRef = { id: string; number: number; name: string };

/** Accepts SDG numbers ("4; 17", "ODS 4") or names, matched to existing SDGs. */
export function mapSdgs(raw: unknown, sdgs: readonly SdgRef[]): MappedList<string> {
  const byNumber = new Map(sdgs.map((sdg) => [sdg.number, sdg.id]));
  const byName = new Map(sdgs.map((sdg) => [normalizeText(sdg.name), sdg.id]));
  // "16 Paz, Justiça e Instituições Eficazes": one SDG per line, the name may contain commas.
  const lines = isPlaceholder(raw) ? [] : String(raw).split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const numbered =
    lines.length > 0 &&
    lines.every((line) => /^(?:ods\s*)?\d{1,2}\b/i.test(line)) &&
    lines.some((line) => /^\d{1,2}\s+\p{L}/u.test(line));
  if (numbered) {
    const values: string[] = [];
    const dropped: string[] = [];
    for (const line of lines) {
      const id = byNumber.get(Number(/\d{1,2}/.exec(line)![0]));
      if (!id) dropped.push(line);
      else if (!values.includes(id)) values.push(id);
    }
    return { values, dropped };
  }
  return mapEach(raw, (n) => {
    const digits = /^(?:ods\s*)?(\d{1,2})\b/.exec(n);
    if (digits) return byNumber.get(Number(digits[1])) ?? null;
    return byName.get(n) ?? null;
  });
}

/** Text fields where "-" means "nothing": returns null for placeholders. */
export function cleanOptionalText(raw: unknown): string | null {
  if (isPlaceholder(raw)) return null;
  return String(raw).trim();
}

export const NO_MATERIALS_TEXT = 'Nenhum material necessário';

/** Duplicate key parts: normalised name, compared together with the age groups. */
export function normalizeName(name: string): string {
  return normalizeText(name);
}

// --- header aliases ----------------------------------------------------------

export const COLUMN_ALIASES = {
  external_id: ['atividade_id', 'id'],
  name: ['nome', 'atividade', 'titulo', 'name'],
  description: ['descricao', 'description'],
  materials: ['materiais', 'materials'],
  instructions: ['intrucoes', 'instrucoes', 'instructions'],
  minutes: ['mins', 'minutos', 'duracao', 'duracao_minutos', 'duracao_min_max'],
  group: ['grupo', 'tamanho_grupo', 'tamanho_do_grupo'],
  effort: ['esforco', 'esforco_fisico', 'nivel_de_esforco', 'nivel_esforco'],
  location: ['local'],
  type: ['tipo', 'tipo_de_atividade'],
  format: ['formato'],
  focus: ['foco', 'foco_principal'],
  focus_secondary: ['foco_secundario'],
  minutes_min: ['duracao_min'],
  minutes_max: ['duracao_max'],
  published: ['publicada'],
  state: ['estado'],
  confidence: ['confianca'],
  variants: ['variantes'],
  age: ['divisao', 'divisoes', 'faixa_etaria', 'seccao'],
  sdgs: ['ods'],
  source: ['fonte'],
  source_url: ['link_fonte'],
  image: ['imagem_url', 'imagem'],
  risk_physical: ['risco_fisico'],
  risk_psychological: ['risco_psicologico'],
  mitigation_physical: ['mitigacao_fisica'],
  mitigation_psychological: ['mitigacao_psicologica'],
  objectives: ['objetivos_educativos_por_divisao', 'objetivos_educativos'],
  behaviours: ['comportamentos_a_observar_objetivos', 'comportamentos_a_observar'],
  sdg_justification: ['justificacao_dos_ods', 'justificacao_ods'],
  challenges: ['desafios'],
} as const;

export type ColumnKey = keyof typeof COLUMN_ALIASES;

export const REQUIRED_COLUMNS: readonly ColumnKey[] = [
  'name',
  'description',
  'minutes',
  'group',
  'effort',
  'location',
  'format',
  'focus',
  'age',
];

/** Maps each known field to the header actually used in the file (if any). */
export function resolveColumns(headers: readonly string[]): Partial<Record<ColumnKey, string>> {
  const byNormalized = new Map<string, string>();
  for (const header of headers) {
    const key = normalizeHeader(header);
    if (key && !byNormalized.has(key)) byNormalized.set(key, header);
  }
  const resolved: Partial<Record<ColumnKey, string>> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [ColumnKey, readonly string[]][]) {
    const hit = aliases.find((alias) => byNormalized.has(alias));
    if (hit) resolved[field] = byNormalized.get(hit)!;
  }
  return resolved;
}
