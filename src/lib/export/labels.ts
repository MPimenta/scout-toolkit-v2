const GROUP_SIZE: Record<string, string> = {
  small: 'Pequeno (2-6)',
  medium: 'Médio (7-15)',
  large: 'Grande (16+)',
};

const EFFORT_LEVEL: Record<string, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

const LOCATION: Record<string, string> = {
  inside: 'Interior',
  outside: 'Exterior',
};

export const exportLabels = {
  summarySheet: 'Resumo',
  scheduleSheet: 'Cronograma',
  detailsSheet: 'Detalhes das Atividades',
  programSummary: 'Resumo do Programa',
  programName: 'Nome do Programa',
  date: 'Data',
  startTime: 'Hora de Início',
  createdBy: 'Criado por',
  createdAt: 'Criado em',
  totalEntries: 'Total de Entradas',
  totalDuration: 'Duração Total',
  educationalGoals: 'Objetivos Educativos',
  sdgs: 'ODS',
  notSpecified: 'Não especificada',
  activity: 'Atividade',
  customBlock: 'Bloco personalizado',
  unknownActivity: 'Atividade desconhecida',
  untitled: 'Sem título',
  position: 'Posição',
  type: 'Tipo',
  title: 'Título',
  durationMin: 'Duração (min)',
  groupSize: 'Tamanho do Grupo',
  effortLevel: 'Nível de Esforço',
  location: 'Local',
  activityType: 'Tipo de Atividade',
  activityName: 'Nome da Atividade',
  description: 'Descrição',
  materials: 'Materiais',
  none: '—',
};

export function translateGroupSize(value: string | null | undefined): string {
  if (!value) return '';
  return GROUP_SIZE[value] ?? value;
}

export function translateEffortLevel(value: string | null | undefined): string {
  if (!value) return '';
  return EFFORT_LEVEL[value] ?? value;
}

export function translateLocation(value: string | null | undefined): string {
  if (!value) return '';
  return LOCATION[value] ?? value;
}

export function formatExportDate(value: string | Date | null | undefined): string {
  if (!value) return exportLabels.notSpecified;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return exportLabels.notSpecified;
  return date.toLocaleDateString('pt-PT');
}

export function formatGoalLabel(goal: { code?: string | null; title: string }): string {
  return goal.code ? `${goal.code} ${goal.title}` : goal.title;
}

export function formatSdgLabel(sdg: { number: number; name: string }): string {
  return `ODS ${sdg.number}: ${sdg.name}`;
}

export function formatGoalsList(goals: Array<{ code?: string | null; title: string }>): string {
  if (goals.length === 0) return exportLabels.none;
  return goals.map(formatGoalLabel).join('; ');
}

export function formatSdgsList(sdgs: Array<{ number: number; name: string }>): string {
  if (sdgs.length === 0) return exportLabels.none;
  return sdgs.map(formatSdgLabel).join('; ');
}

export function buildExportFilename(programName: string, extension: 'xlsx' | 'pdf'): string {
  const safeName = programName.replace(/[^a-zA-Z0-9À-ÿ]/g, '_');
  const date = new Date().toISOString().split('T')[0];
  return `programa_${safeName}_${date}.${extension}`;
}
