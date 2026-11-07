import { parseObjectiveCode } from '../reference-data/objective-code';
import { isPlaceholder, normalizeText } from './baseline-map';
import type { AgeGroupValue, RiskLevelValue } from './category-values';

/**
 * Pure parsers for the rich columns of the curated activities sheet: risk cells,
 * per-division objective and behaviour blocks, SDG justifications, desafio lines.
 */

/* ---------- Risk ---------- */

export type ParsedRisk = {
  level: RiskLevelValue | null;
  text: string | null;
  /** "Baixo a médio: …" style cells: the higher level is stored and the wording is kept. */
  range: boolean;
};

const LEVELS: Record<string, RiskLevelValue> = { baixo: 'low', medio: 'medium', alto: 'high' };
const RISK_HEAD = /^\s*(baixo|medio|alto)(?:\s+a\s+(baixo|medio|alto))?\s*[:\-–]\s*/i;

export function parseRiskCell(raw: unknown): ParsedRisk {
  if (isPlaceholder(raw)) return { level: null, text: null, range: false };
  const original = String(raw).trim();
  const head = RISK_HEAD.exec(normalizeText(original));
  if (!head) return { level: null, text: original, range: false };
  const first = LEVELS[head[1]!]!;
  const second = head[2] ? LEVELS[head[2]] : undefined;
  if (second) {
    const order: RiskLevelValue[] = ['low', 'medium', 'high'];
    const level = order[Math.max(order.indexOf(first), order.indexOf(second))]!;
    return { level, text: original, range: true };
  }
  // The normalised head and the original text have the same length up to the colon.
  const colon = original.search(/[:\-–]/);
  const rest = colon >= 0 ? original.slice(colon + 1).trim() : '';
  return { level: first, text: rest || null, range: false };
}

/* ---------- Per-division blocks ---------- */

export type DivisionLine = { code: string; text: string };
export type DivisionBlocks = Map<AgeGroupValue, DivisionLine[]>;

const DIVISION_LABELS: Array<[RegExp, AgeGroupValue]> = [
  [/^lobito|^alcateia/, 'cub_scouts'],
  [/^escoteiro/, 'scouts'],
  [/^explorador|^pioneiro/, 'adventurers'],
  [/^caminheiro|^cla\b/, 'rovers'],
  [/^dirigente|^chefia/, 'leaders'],
];

function divisionOfLabel(line: string): AgeGroupValue | null {
  const normalized = normalizeText(line);
  if (!normalized.endsWith(':')) return null;
  for (const [pattern, group] of DIVISION_LABELS) if (pattern.test(normalized)) return group;
  return null;
}

const BULLET = /^\s*[•\-*]\s*(.*)$/;
const CODE_AT_START = /^(\d[ACEFIS](?:\.?\d)?\.\d(?:-\d)?)\s*[:.]?\s*(.*)$/;

/**
 * "Lobitos:\n• 4E.1.1 Texto\n• 4S.2.1 Texto" (objectives) or "• 4E.1.1: comportamento"
 * (behaviours) into lines per division. Lines without a bullet continue the previous one.
 */
export function parseDivisionBlocks(raw: unknown): { blocks: DivisionBlocks; unparsed: string[] } {
  const blocks: DivisionBlocks = new Map();
  const unparsed: string[] = [];
  if (isPlaceholder(raw)) return { blocks, unparsed };
  let current: AgeGroupValue | null = null;
  let last: DivisionLine | null = null;

  for (const line of String(raw).replace(/\r\n/g, '\n').split('\n')) {
    if (!line.trim()) continue;
    const division = divisionOfLabel(line.trim());
    if (division) {
      current = division;
      last = null;
      if (!blocks.has(division)) blocks.set(division, []);
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet && current) {
      const body = CODE_AT_START.exec(bullet[1]!.trim());
      const parsed = body ? parseObjectiveCode(body[1]!) : null;
      if (!body || !parsed) {
        unparsed.push(line.trim());
        last = null;
        continue;
      }
      last = { code: parsed.canonical, text: body[2]!.trim() };
      blocks.get(current)!.push(last);
      continue;
    }
    if (last) last.text = `${last.text} ${line.trim()}`.trim();
    else unparsed.push(line.trim());
  }
  return { blocks, unparsed };
}

/* ---------- SDGs ---------- */

/** "ODS 3: texto\nODS 17: texto" into a map from SDG number to its justification. */
export function parseSdgJustifications(raw: unknown): Map<number, string> {
  const map = new Map<number, string>();
  if (isPlaceholder(raw)) return map;
  const text = String(raw).replace(/\r\n/g, '\n');
  const pattern = /(?:^|\n)\s*ODS\s*(\d{1,2})\s*:\s*/gi;
  const marks: Array<{ number: number; start: number; end: number }> = [];
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    marks.push({ number: Number(match[1]), start: match.index, end: match.index + match[0].length });
  }
  marks.forEach((mark, index) => {
    const next = marks[index + 1]?.start ?? text.length;
    const body = text.slice(mark.end, next).replace(/\s+/g, ' ').trim();
    if (body) map.set(mark.number, body);
  });
  return map;
}

/* ---------- Desafios ---------- */

/** "EVAS-B - Participa…\nCC-A - Partilha…" into codes (text is ignored: the Matriz owns it). */
export function parseChallengeCodes(raw: unknown): string[] {
  if (isPlaceholder(raw)) return [];
  const codes: string[] = [];
  for (const line of String(raw).replace(/\r\n/g, '\n').split('\n')) {
    const match = /^\s*([A-Z]{2,5}-[A-P])\b/.exec(line);
    if (match && !codes.includes(match[1]!)) codes.push(match[1]!);
  }
  return codes;
}

/* ---------- Sources ---------- */

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length]![b.length]!;
}

export type SourceRef = { id: string; code: string; name: string };

/** Matches the "Fonte" cell to a source by name or code, tolerating a one-letter typo. */
export function matchSource(raw: unknown, sources: readonly SourceRef[]): SourceRef | null {
  if (isPlaceholder(raw)) return null;
  const wanted = normalizeText(String(raw));
  const exact = sources.find((source) => normalizeText(source.name) === wanted || normalizeText(source.code) === wanted);
  if (exact) return exact;
  const close = sources.filter((source) => wanted.length > 4 && editDistance(normalizeText(source.name), wanted) <= 1);
  return close.length === 1 ? close[0]! : null;
}
