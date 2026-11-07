import * as XLSX from 'xlsx';
import type { ProgramExportEntry, ProgramForExport } from './types';
import {
  buildExportFilename,
  exportLabels,
  formatExportDate,
  formatGoalLabel,
  formatGoalsList,
  formatSdgLabel,
  formatSdgsList,
  translateEffortLevel,
  translateGroupSize,
  translateLocation,
  translateList,
} from './labels';

function formatRisk(risk: { level: string | null; risk: string | null; mitigation: string | null } | undefined): string {
  if (!risk || (!risk.level && !risk.risk && !risk.mitigation)) return '';
  const level = risk.level ? exportLabels.riskLevels[risk.level] ?? risk.level : '';
  const parts = [[level, risk.risk].filter(Boolean).join(': ')];
  if (risk.mitigation) parts.push(`${exportLabels.mitigation}: ${risk.mitigation}`);
  return parts.filter(Boolean).join('\n');
}

function formatObjectives(objectives: Array<{ code: string; age_group: string; behaviour: string | null }>): string {
  return objectives
    .map((row) => `${row.age_group} ${row.code}${row.behaviour ? `: ${row.behaviour}` : ''}`)
    .join('\n');
}

/**
 * Builds a Portuguese Excel workbook for a program: Resumo, Cronograma,
 * and Detalhes das Atividades (when the program includes activities).
 */
export function buildProgramExcelWorkbook(program: ProgramForExport): {
  buffer: Buffer;
  filename: string;
} {
  const workbook = XLSX.utils.book_new();
  const uniqueGoals = getUniqueEducationalGoals(program.entries);
  const uniqueSdgs = getUniqueSdgs(program.entries);

  const summaryData: Array<Array<string | number>> = [
    [exportLabels.programSummary, ''],
    [exportLabels.programName, program.name],
    [exportLabels.date, formatExportDate(program.date)],
    [exportLabels.startTime, program.start_time],
    [exportLabels.createdBy, program.user.name || exportLabels.none],
    [exportLabels.createdAt, formatExportDate(program.created_at)],
    [exportLabels.totalEntries, program.entries.length],
    [exportLabels.totalDuration, calculateTotalDuration(program.entries)],
    ['', ''],
    [exportLabels.educationalGoals, ''],
    ...(uniqueGoals.length > 0
      ? uniqueGoals.map((goal) => ['', formatGoalLabel(goal)])
      : [['', exportLabels.none]]),
    ['', ''],
    [exportLabels.sdgs, ''],
    ...(uniqueSdgs.length > 0
      ? uniqueSdgs.map((sdg) => ['', formatSdgLabel(sdg)])
      : [['', exportLabels.none]]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 24 }, { wch: 56 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, exportLabels.summarySheet);

  const scheduleData: Array<Array<string>> = [
    [
      exportLabels.position,
      exportLabels.startTime,
      'Hora de Fim',
      exportLabels.type,
      exportLabels.title,
      exportLabels.durationMin,
      exportLabels.groupSize,
      exportLabels.effortLevel,
      exportLabels.location,
      exportLabels.activityType,
      exportLabels.educationalGoals,
      exportLabels.sdgs,
    ],
  ];

  program.entries.forEach((entry, index) => {
    const isActivity = entry.entry_type === 'activity';
    scheduleData.push([
      (index + 1).toString(),
      entry.start_time,
      entry.end_time,
      isActivity ? exportLabels.activity : exportLabels.customBlock,
      isActivity
        ? entry.activity?.name || exportLabels.unknownActivity
        : entry.custom_title || exportLabels.untitled,
      (isActivity
        ? entry.activity?.approximate_duration_minutes || 0
        : entry.custom_duration_minutes || 0
      ).toString(),
      isActivity ? translateList(entry.activity?.group_sizes, translateGroupSize) : '',
      isActivity ? translateEffortLevel(entry.activity?.effort_level) : '',
      isActivity ? translateList(entry.activity?.locations, translateLocation) : '',
      isActivity ? (entry.activity?.activityTypes ?? []).map((t) => t.name).join(', ') : '',
      isActivity ? formatGoalsList(entry.activity?.educationalGoals ?? []) : '',
      isActivity ? formatSdgsList(entry.activity?.sdgs ?? []) : '',
    ]);
  });

  const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
  scheduleSheet['!cols'] = Array(12).fill({ wch: 18 });
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, exportLabels.scheduleSheet);

  const activityEntries = program.entries
    .filter((entry) => entry.entry_type === 'activity' && entry.activity)
    .map((entry) => entry.activity!);

  if (activityEntries.length > 0) {
    const activityDetailsData: Array<Array<string>> = [
      [
        exportLabels.activityName,
        exportLabels.description,
        exportLabels.materials,
        exportLabels.instructions,
        exportLabels.groupSize,
        exportLabels.effortLevel,
        exportLabels.location,
        exportLabels.activityType,
        exportLabels.educationalGoals,
        exportLabels.sdgs,
        exportLabels.physicalRisk,
        exportLabels.psychologicalRisk,
        exportLabels.objectivesByDivision,
        exportLabels.challenges,
        exportLabels.source,
      ],
    ];

    activityEntries.forEach((activity) => {
      activityDetailsData.push([
        activity.name || '',
        activity.description || '',
        activity.materials || '',
        activity.instructions || '',
        translateList(activity.group_sizes, translateGroupSize),
        translateEffortLevel(activity.effort_level),
        translateList(activity.locations, translateLocation),
        activity.activityTypes.map((t) => t.name).join(', '),
        formatGoalsList(activity.educationalGoals),
        formatSdgsList(activity.sdgs),
        formatRisk(activity.physicalRisk),
        formatRisk(activity.psychologicalRisk),
        formatObjectives(activity.objectives ?? []),
        (activity.challenges ?? []).map((challenge) => `${challenge.code} - ${challenge.title}`).join('\n'),
        activity.source ? [activity.source.name, activity.source.license].filter(Boolean).join(' · ') : '',
      ]);
    });

    const activityDetailsSheet = XLSX.utils.aoa_to_sheet(activityDetailsData);
    activityDetailsSheet['!cols'] = Array(15).fill({ wch: 22 });
    XLSX.utils.book_append_sheet(workbook, activityDetailsSheet, exportLabels.detailsSheet);
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return {
    buffer,
    filename: buildExportFilename(program.name, 'xlsx'),
  };
}

export function calculateTotalDuration(entries: ProgramExportEntry[]): string {
  const totalMinutes = entries.reduce((total, entry) => {
    if (entry.entry_type === 'activity' && entry.activity) {
      return total + (entry.activity.approximate_duration_minutes || 0);
    }
    if (entry.entry_type === 'custom') {
      return total + (entry.custom_duration_minutes || 0);
    }
    return total;
  }, 0);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function getUniqueEducationalGoals(
  entries: ProgramExportEntry[]
): Array<{ title: string; code: string }> {
  const goals = new Map<string, { title: string; code: string }>();

  entries.forEach((entry) => {
    entry.activity?.educationalGoals.forEach((goal) => {
      goals.set(`${goal.code}:${goal.title}`, goal);
    });
  });

  return Array.from(goals.values());
}

export function getUniqueSdgs(
  entries: ProgramExportEntry[]
): Array<{ number: number; name: string }> {
  const sdgMap = new Map<number, string>();

  entries.forEach((entry) => {
    entry.activity?.sdgs.forEach((sdg) => {
      sdgMap.set(sdg.number, sdg.name);
    });
  });

  return Array.from(sdgMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, name]) => ({ number, name }));
}
