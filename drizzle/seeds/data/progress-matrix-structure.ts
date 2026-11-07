/**
 * Reviewed constants for the Matriz Progresso Pessoal: the six educational areas,
 * the 20 Caminhos Educativos (educational paths) and the seven challenge types.
 *
 * Source: Regulamento do Programa para Jovens v1.2 (Dec 2024), Anexo 1, pp. 24-26
 * (each path row lists the general objectives it contains). The workbook has no
 * paths, so they live here and the generator checks that every general objective
 * is assigned to exactly one path.
 */
export const MATRIX_AREAS = [
  { code: 'F', name: 'Físico', icon: '💪' },
  { code: 'A', name: 'Afetivo', icon: '❤️' },
  { code: 'C', name: 'Carácter', icon: '🧭' },
  { code: 'E', name: 'Espiritual', icon: '✨' },
  { code: 'I', name: 'Intelectual', icon: '🧠' },
  { code: 'S', name: 'Social', icon: '🤝' },
] as const;

export interface MatrixPath {
  /** `<area letter>.<n>`, stable. */
  code: string;
  area: (typeof MATRIX_AREAS)[number]['code'];
  name: string;
  /** Codes of the general objectives under this path, in order. */
  generalObjectives: readonly string[];
}

export const MATRIX_PATHS: readonly MatrixPath[] = [
  { code: 'F.1', area: 'F', name: 'Conhecimento do corpo', generalObjectives: ['1F', '2F'] },
  { code: 'F.2', area: 'F', name: 'Estilo de vida ativo e saudável', generalObjectives: ['3F', '4F'] },
  { code: 'F.3', area: 'F', name: 'Eficiência', generalObjectives: ['5F'] },
  { code: 'A.1', area: 'A', name: 'Consciência Emocional', generalObjectives: ['1A'] },
  { code: 'A.2', area: 'A', name: 'Expressão Criativa', generalObjectives: ['2A'] },
  { code: 'A.3', area: 'A', name: 'Regulação emocional', generalObjectives: ['3A', '4A', '5A'] },
  { code: 'C.1', area: 'C', name: 'Identidade', generalObjectives: ['1C', '2C'] },
  { code: 'C.2', area: 'C', name: 'Autonomia', generalObjectives: ['3C', '4C'] },
  { code: 'C.3', area: 'C', name: 'Compromisso', generalObjectives: ['5C', '6C', '7C'] },
  { code: 'C.4', area: 'C', name: 'Valores', generalObjectives: ['8C', '9C'] },
  { code: 'E.1', area: 'E', name: 'Deslumbramento', generalObjectives: ['1E'] },
  { code: 'E.2', area: 'E', name: 'Sabedoria', generalObjectives: ['2E', '3E'] },
  { code: 'E.3', area: 'E', name: 'Pertença', generalObjectives: ['4E'] },
  { code: 'E.4', area: 'E', name: 'Descoberta e reflexão', generalObjectives: ['5E', '6E', '7E'] },
  { code: 'I.1', area: 'I', name: 'Recolha de informação', generalObjectives: ['1I'] },
  { code: 'I.2', area: 'I', name: 'Análise Crítica', generalObjectives: ['2I', '3I'] },
  { code: 'I.3', area: 'I', name: 'Resolução de problemas', generalObjectives: ['4I', '5I', '6I'] },
  { code: 'S.1', area: 'S', name: 'Relacionamento e comunicação', generalObjectives: ['1S', '2S', '3S'] },
  { code: 'S.2', area: 'S', name: 'Cooperação e liderança', generalObjectives: ['4S', '5S'] },
  { code: 'S.3', area: 'S', name: 'Solidariedade e envolvimento', generalObjectives: ['6S', '7S', '8S'] },
];

/** Challenge types in the workbook's order, with stable codes. */
export const MATRIX_CHALLENGE_TYPES = [
  { code: 'EVAS', name: 'Estilo de Vida Ativo e Saudável' },
  { code: 'VAL', name: 'Vida ao Ar Livre' },
  { code: 'CC', name: 'Comunidade e Cidadania' },
  { code: 'VA', name: 'Valores e Atitudes' },
  { code: 'VE', name: 'Vivência Escotista' },
  { code: 'TU', name: 'Técnicas Úteis' },
  { code: 'CR', name: 'Criatividade' },
] as const;

/** Age group served by each stage digit used in objective codes (1 Alcateia ... 4 Clã). */
export const STAGE_AGE_GROUP = {
  1: 'cub_scouts',
  2: 'scouts',
  3: 'adventurers',
  4: 'rovers',
} as const;
