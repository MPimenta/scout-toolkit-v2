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
} from './labels';

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
      isActivity ? translateGroupSize(entry.activity?.group_size) : '',
      isActivity ? translateEffortLevel(entry.activity?.effort_level) : '',
      isActivity ? translateLocation(entry.activity?.location) : '',
      isActivity ? entry.activity?.activityType?.name || '' : '',
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
        exportLabels.groupSize,
        exportLabels.effortLevel,
        exportLabels.location,
        exportLabels.activityType,
        exportLabels.educationalGoals,
        exportLabels.sdgs,
      ],
    ];

    activityEntries.forEach((activity) => {
      activityDetailsData.push([
        activity.name || '',
        activity.description || '',
        activity.materials || '',
        translateGroupSize(activity.group_size),
        translateEffortLevel(activity.effort_level),
        translateLocation(activity.location),
        activity.activityType?.name || '',
        formatGoalsList(activity.educationalGoals),
        formatSdgsList(activity.sdgs),
      ]);
    });

    const activityDetailsSheet = XLSX.utils.aoa_to_sheet(activityDetailsData);
    activityDetailsSheet['!cols'] = Array(9).fill({ wch: 22 });
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
