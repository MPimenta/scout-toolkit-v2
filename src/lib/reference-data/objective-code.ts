/**
 * Objective code grammar for the Matriz Progresso Pessoal:
 * `<n><area>.[<sub>.]<stage>[-<stage>]`, area letter in A C E F I S, stage 1-4
 * (1 Alcateia, 2 Escoteiros, 3 Exploradores, 4 Clã). Examples: 1A.2, 4F.1.1, 3A.3-4.
 * The Regulamento writes the sub-group without a dot (4F1.1); both forms parse.
 */
export interface ParsedObjectiveCode {
  /** Canonical form with the dotted sub-group, for example "4F.1.1". */
  canonical: string;
  /** General objective code, for example "4F". */
  general: string;
  number: number;
  area: string;
  sub: number | null;
  /** Stages the code covers (one, or two for a "3-4" range). */
  stages: number[];
}

const CODE = /^(\d)([ACEFIS])(?:\.?(\d))?\.(\d)(?:-(\d))?$/;

export function parseObjectiveCode(raw: string): ParsedObjectiveCode | null {
  const match = CODE.exec(raw.trim().replace(/\.$/, ''));
  if (!match) return null;
  const [, n, area, sub, first, last] = match;
  const stages = last ? [Number(first), Number(last)] : [Number(first)];
  if (stages.some((s) => s < 1 || s > 4)) return null;
  const general = `${n}${area}`;
  const canonical = `${general}.${sub ? `${sub}.` : ''}${first}${last ? `-${last}` : ''}`;
  return { canonical, general, number: Number(n), area, sub: sub ? Number(sub) : null, stages };
}
