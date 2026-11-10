import {
  COLUMN_ALIASES,
  NO_MATERIALS_TEXT,
  REQUIRED_COLUMNS,
  cleanOptionalText,
  isPlaceholder,
  mapAgeGroups,
  mapEffort,
  mapGroupSizes,
  mapLocations,
  mapNamedValue,
  mapSdgs,
  normalizeName,
  normalizeText,
  parseBoolean,
  parseDuration,
  resolveColumns,
  type ColumnKey,
  type NamedRef,
  type SdgRef,
} from './baseline-map';
import {
  matchSource,
  parseChallengeCodes,
  parseDivisionBlocks,
  parseRiskCell,
  parseSdgJustifications,
  type SourceRef,
} from './baseline-rich';
import { parseDurationRange } from './duration-range';
import type { ActivityWrite, ObjectiveRow } from './write';
import type { AgeGroupValue } from './category-values';

/**
 * Turns the rows of an exported sheet into validated, selected activities and a
 * report. Pure: no file or database access, so it is fully unit-testable.
 */

export type SheetRow = Record<string, unknown>;

export type Taxonomies = {
  /** The official formats and focuses, matched by name or code; never created from activity rows. */
  formats: readonly NamedRef[];
  focuses: readonly NamedRef[];
  sdgs: readonly SdgRef[];
  /** Matriz objectives with the divisions they belong to (needed for objective rows). */
  goals?: ReadonlyArray<{ id: string; code: string; age_groups: readonly string[] }>;
  /** Matriz desafios by code. */
  challenges?: ReadonlyArray<{ id: string; code: string }>;
  sources?: readonly SourceRef[];
};

export type PlanOptions = {
  limit: number;
  seed: number;
  /** Normalised name + age groups of activities already in the catalogue. */
  existing?: ReadonlyArray<{ name: string; age_groups: readonly string[] }>;
};

export type PlannedActivity = {
  /** Row number in the file (1 = first data row). */
  row: number;
  externalId: string | null;
  source: string | null;
  /** The sheet's Publicada cell. */
  published: boolean;
  data: ActivityWrite;
};

export type SkippedRow = { row: number; externalId: string | null; name: string | null; reason: string };

export type LoadReport = {
  rowsRead: number;
  valid: number;
  selected: number;
  skipped: SkippedRow[];
  /** Count of rows with a non-empty value, per field. */
  fillRates: Record<string, { filled: number; total: number }>;
  collapsedDurations: Array<{ row: number; note: string }>;
  droppedValues: Array<{ row: number; externalId?: string | null; field: string; values: string[] }>;
  /** Blocks written for Dirigentes that were left out on purpose (they have no objectives): number of activities. */
  ignored: { dirigentesBlocks: number };
  /** Review fields of the sheet that are counted but not stored. */
  reviewStates: { estado: Record<string, number>; confianca: Record<string, number>; variantes: number };
  /** Values kept but worth a look, for example a risk range stored as its higher level. */
  notes: Array<{ row: number; note: string }>;
  unmapped: {
    sdgs: Record<string, number>;
  };
};

export type LoadPlan = {
  selected: PlannedActivity[];
  report: LoadReport;
  /** Set when required columns are missing; nothing else is produced. */
  missingColumns?: string[];
};

const EXAMPLE_MARKER = /\(exemplo\)/i;

function cell(row: SheetRow, header: string | undefined): unknown {
  return header ? row[header] : undefined;
}

function text(row: SheetRow, header: string | undefined): string {
  const value = cell(row, header);
  return value === undefined || value === null ? '' : String(value).trim();
}

function bump(counter: Record<string, number>, key: string) {
  counter[key] = (counter[key] ?? 0) + 1;
}

/** Small deterministic PRNG (mulberry32) so selection is repeatable. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Risk analysis, objectives per division with behaviours, SDG justifications, desafios, source. */
function buildRichFields(
  raw: SheetRow,
  columns: Partial<Record<ColumnKey, string>>,
  taxonomies: Taxonomies,
  ageGroups: readonly AgeGroupValue[],
  sdgIds: readonly string[],
  rowNumber: number,
  report: LoadReport,
  externalId: string | null
): Partial<ActivityWrite> {
  const dropped = (field: string, values: string[]) => {
    if (values.length > 0) report.droppedValues.push({ row: rowNumber, externalId, field, values });
  };
  const out: Partial<ActivityWrite> = {};

  for (const [kind, riskKey, mitigationKey] of [
    ['physical', 'risk_physical', 'mitigation_physical'],
    ['psychological', 'risk_psychological', 'mitigation_psychological'],
  ] as const) {
    const risk = parseRiskCell(cell(raw, columns[riskKey]));
    out[`${kind}_risk_level`] = risk.level;
    out[`${kind}_risk`] = risk.text;
    out[`${kind}_mitigation`] = cleanOptionalText(cell(raw, columns[mitigationKey]));
    if (risk.range) report.notes.push({ row: rowNumber, note: `risco ${kind}: intervalo guardado como nível mais alto` });
    if (risk.text && !risk.level) dropped(`risco ${kind === 'physical' ? 'físico' : 'psicológico'} sem nível`, [risk.text.slice(0, 40)]);
  }

  const imageCell = text(raw, columns.image);
  if (imageCell.startsWith('https://')) out.image_url = imageCell;
  const sourceUrl = text(raw, columns.source_url);
  if (sourceUrl.startsWith('https://')) out.source_url = sourceUrl;
  const sourceCell = text(raw, columns.source);
  if (sourceCell && taxonomies.sources) {
    const source = matchSource(sourceCell, taxonomies.sources);
    if (source) out.source_id = source.id;
    else dropped('fonte', [sourceCell]);
  }

  // Objectives per division, with the behaviour of the same (division, code)
  if (taxonomies.goals) {
    const goalByCode = new Map(taxonomies.goals.map((goal) => [goal.code, goal]));
    const objectives = parseDivisionBlocks(cell(raw, columns.objectives));
    const behaviours = parseDivisionBlocks(cell(raw, columns.behaviours));
    dropped('objetivos (linhas ilegíveis)', objectives.unparsed);
    // Dirigentes have no objectives: their blocks are skipped on purpose, not reported as errors.
    if (objectives.blocks.has('leaders') || behaviours.blocks.has('leaders')) report.ignored.dirigentesBlocks += 1;
    const rows: ObjectiveRow[] = [];
    const used = new Set<string>();
    const unknown: string[] = [];
    const wrongDivision: string[] = [];
    for (const [division, lines] of objectives.blocks) {
      if (division === 'leaders') continue;
      if (!ageGroups.includes(division)) {
        wrongDivision.push(`${division}: divisão não está na atividade`);
        continue;
      }
      for (const line of lines) {
        const goal = goalByCode.get(line.code);
        if (!goal) {
          unknown.push(line.code);
          continue;
        }
        // Dirigentes have no objectives in the Matriz, so a block written for them is dropped.
        if (!goal.age_groups.includes(division)) {
          wrongDivision.push(`${division}: ${line.code}`);
          continue;
        }
        const behaviour = behaviours.blocks.get(division)?.find((item) => item.code === line.code);
        if (behaviour) used.add(`${division}:${line.code}`);
        if (!rows.some((row) => row.goal_id === goal.id && row.age_group === division)) {
          rows.push({ goal_id: goal.id, age_group: division, behaviour: behaviour?.text || null });
        }
      }
    }
    dropped('objetivos desconhecidos', unknown);
    dropped('objetivos fora da divisão', wrongDivision);
    const orphans = [...behaviours.blocks].filter(([division]) => division !== 'leaders').flatMap(([division, lines]) =>
      lines.filter((line) => !used.has(`${division}:${line.code}`)).map((line) => `${division}: ${line.code}`)
    );
    dropped('comportamentos sem objetivo', orphans);
    dropped('comportamentos (linhas ilegíveis)', behaviours.unparsed);
    out.objectives = rows;
  }

  // SDGs with their justification (by SDG number)
  const justifications = parseSdgJustifications(cell(raw, columns.sdg_justification));
  const numberById = new Map(taxonomies.sdgs.map((sdg) => [sdg.id, sdg.number]));
  out.sdgs = sdgIds.map((id) => ({ sdg_id: id, justification: justifications.get(numberById.get(id) ?? -1) ?? null }));
  const linkedNumbers = new Set(sdgIds.map((id) => numberById.get(id)));
  dropped(
    'justificação de ODS não ligado',
    [...justifications.keys()].filter((number) => !linkedNumbers.has(number)).map(String)
  );

  // Desafios by code
  if (taxonomies.challenges) {
    const byCode = new Map(taxonomies.challenges.map((challenge) => [challenge.code, challenge.id]));
    const codes = parseChallengeCodes(cell(raw, columns.challenges));
    out.challenge_ids = codes.flatMap((code) => (byCode.has(code) ? [byCode.get(code)!] : []));
    dropped('desafios desconhecidos', codes.filter((code) => !byCode.has(code)));
  }
  return out;
}

export function planBaselineLoad(
  headers: readonly string[],
  rows: readonly SheetRow[],
  taxonomies: Taxonomies,
  options: PlanOptions
): LoadPlan {
  const columns = resolveColumns(headers);
  const missing = REQUIRED_COLUMNS.filter((key) => !columns[key]);
  const emptyReport: LoadReport = {
    rowsRead: 0,
    valid: 0,
    selected: 0,
    skipped: [],
    fillRates: {},
    collapsedDurations: [],
    droppedValues: [],
    reviewStates: { estado: {}, confianca: {}, variantes: 0 },
    ignored: { dirigentesBlocks: 0 },
    notes: [],
    unmapped: { sdgs: {} },
  };
  if (missing.length > 0) {
    return {
      selected: [],
      report: emptyReport,
      missingColumns: missing.map((key) => `${key} (${COLUMN_ALIASES[key].join(' | ')})`),
    };
  }

  const report = emptyReport;
  const fieldKeys = Object.keys(COLUMN_ALIASES) as ColumnKey[];
  for (const key of fieldKeys) report.fillRates[key] = { filled: 0, total: 0 };

  const valid: Array<PlannedActivity & { ageKey: string; dedupeName: string }> = [];

  rows.forEach((raw, index): void => {
    const rowNumber = index + 1;
    const nonEmpty = Object.values(raw).some((value) => !isPlaceholder(value));
    if (!nonEmpty) return; // blank spacer rows are not data
    report.rowsRead += 1;

    for (const key of fieldKeys) {
      const header = columns[key];
      if (!header) continue;
      report.fillRates[key]!.total += 1;
      if (!isPlaceholder(cell(raw, header))) report.fillRates[key]!.filled += 1;
    }

    const estado = text(raw, columns.state);
    if (estado) bump(report.reviewStates.estado, estado);
    const confianca = text(raw, columns.confidence);
    if (confianca) bump(report.reviewStates.confianca, confianca);
    if (!isPlaceholder(cell(raw, columns.variants))) report.reviewStates.variantes += 1;

    const name = text(raw, columns.name);
    const externalId = text(raw, columns.external_id) || null;
    const skip = (reason: string): void =>
      void report.skipped.push({ row: rowNumber, externalId, name: name || null, reason });

    if (!name) return skip('nome em falta');
    if (EXAMPLE_MARKER.test(name)) return skip('linha de exemplo');

    const description = text(raw, columns.description);
    if (!description || isPlaceholder(description)) return skip('descrição em falta');

    const duration = parseDuration(cell(raw, columns.minutes));
    if (!duration.ok) return skip(duration.reason);
    if (duration.note) report.collapsedDurations.push({ row: rowNumber, note: duration.note });

    const effort = mapEffort(cell(raw, columns.effort));
    if (!effort.value) return skip('esforço em falta ou não reconhecido');

    const groups = mapGroupSizes(cell(raw, columns.group));
    const locations = mapLocations(cell(raw, columns.location));
    const ages = mapAgeGroups(cell(raw, columns.age));
    const format = mapNamedValue(cell(raw, columns.format), taxonomies.formats);
    const focus = mapNamedValue(cell(raw, columns.focus), taxonomies.focuses);
    const secondary = mapNamedValue(cell(raw, columns.focus_secondary), taxonomies.focuses);

    const dropped: Array<[string, string[]]> = [
      ['esforço', effort.dropped],
      ['grupo', groups.dropped],
      ['local', locations.dropped],
      ['divisão', ages.dropped],
      ['formato', format.dropped],
      ['foco', focus.dropped],
      ['foco secundário', secondary.dropped],
    ];
    // Unknown values are reported even when the row is then skipped, so the report shows everything to fix.
    for (const [field, values] of dropped) {
      if (values.length > 0) report.droppedValues.push({ row: rowNumber, externalId, field, values });
    }

    if (groups.values.length === 0) return skip('grupo em falta ou não reconhecido');
    if (locations.values.length === 0) return skip('local em falta ou não reconhecido');
    if (ages.values.length === 0) return skip('divisão em falta ou não reconhecida');
    if (!format.id) return skip('formato em falta ou não reconhecido');
    if (!focus.id) return skip('foco em falta ou não reconhecido');
    let secondaryId = secondary.id;
    if (secondaryId === focus.id) {
      secondaryId = null;
      report.notes.push({ row: rowNumber, note: 'foco secundário igual ao principal: ignorado' });
    }

    // Optional range next to the single duration the programs use.
    const range = parseDurationRange(cell(raw, columns.minutes_min), cell(raw, columns.minutes_max));
    let durationMin: number | null = null;
    let durationMax: number | null = null;
    if (typeof range === 'string') {
      report.notes.push({ row: rowNumber, note: `intervalo de duração ignorado: ${range}` });
    } else {
      durationMin = range.min;
      durationMax = range.max;
      if ((durationMin !== null && duration.minutes < durationMin) || (durationMax !== null && duration.minutes > durationMax)) {
        report.notes.push({ row: rowNumber, note: `duração ${duration.minutes} min fora do intervalo ${durationMin ?? '?'}-${durationMax ?? '?'}` });
      }
    }

    const sdgs = mapSdgs(cell(raw, columns.sdgs), taxonomies.sdgs);
    for (const miss of sdgs.dropped) bump(report.unmapped.sdgs, miss);

    const rich = buildRichFields(raw, columns, taxonomies, ages.values, sdgs.values, rowNumber, report, externalId);

    const data: ActivityWrite = {
      ...rich,
      name,
      description,
      materials: cleanOptionalText(cell(raw, columns.materials)) ?? NO_MATERIALS_TEXT,
      instructions: cleanOptionalText(cell(raw, columns.instructions)),
      approximate_duration_minutes: duration.minutes,
      duration_min_minutes: durationMin,
      duration_max_minutes: durationMax,
      external_id: externalId,
      format_id: format.id,
      focus_id: focus.id,
      secondary_focus_id: secondaryId,
      group_sizes: groups.values,
      effort_level: effort.value,
      locations: locations.values,
      age_groups: ages.values,
      image_url: rich.image_url ?? null,
      sdg_ids: sdgs.values,
    };
    valid.push({
      row: rowNumber,
      externalId,
      source: text(raw, columns.source) || null,
      published: parseBoolean(cell(raw, columns.published)),
      data,
      ageKey: [...ages.values].sort()[0]!,
      dedupeName: normalizeName(name),
    });
  });

  // Duplicates: same normalised name and at least one shared age group.
  const seen: Array<{ name: string; ages: readonly string[] }> = (options.existing ?? []).map((e) => ({
    name: normalizeName(e.name),
    ages: e.age_groups,
  }));
  const unique: typeof valid = [];
  for (const candidate of valid) {
    // A row with a sheet id is keyed by that id (the sheet is the reference); only rows without one are de-duplicated by name.
    const clash = candidate.externalId
      ? undefined
      : seen.find((s) => s.name === candidate.dedupeName && s.ages.some((a) => candidate.data.age_groups.includes(a as never)));
    if (clash) {
      report.skipped.push({
        row: candidate.row,
        externalId: candidate.externalId,
        name: candidate.data.name,
        reason: 'duplicada (mesmo nome e secção)',
      });
      continue;
    }
    seen.push({ name: candidate.dedupeName, ages: candidate.data.age_groups });
    unique.push(candidate);
  }
  report.valid = unique.length;

  // Selection: round-robin over Fonte x first age group, seeded shuffle inside each bucket.
  const random = seededRandom(options.seed);
  const buckets = new Map<string, typeof unique>();
  for (const candidate of unique) {
    const key = `${normalizeText(candidate.source ?? '')}|${candidate.ageKey}`;
    const list = buckets.get(key) ?? [];
    list.push(candidate);
    buckets.set(key, list);
  }
  const orderedKeys = [...buckets.keys()].sort();
  const queues = orderedKeys.map((key) => shuffle(buckets.get(key)!, random));
  const selected: typeof unique = [];
  while (selected.length < options.limit && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && selected.length < options.limit) selected.push(next);
    }
  }
  report.selected = selected.length;

  return {
    selected: selected.map(({ row, externalId, source, published, data }) => ({ row, externalId, source, published, data })),
    report,
  };
}

export function summarizeReport(report: LoadReport, loaded?: number): string {
  const lines = [
    `Linhas lidas: ${report.rowsRead}`,
    `Válidas (sem duplicadas): ${report.valid}`,
    `Selecionadas: ${report.selected}`,
    ...(loaded === undefined ? [] : [`Carregadas: ${loaded}`]),
    `Ignoradas: ${report.skipped.length}`,
  ];
  const reasons = new Map<string, number>();
  for (const skipped of report.skipped) reasons.set(skipped.reason, (reasons.get(skipped.reason) ?? 0) + 1);
  for (const [reason, count] of [...reasons].sort((a, b) => b[1] - a[1])) lines.push(`  - ${reason}: ${count}`);
  if (report.collapsedDurations.length > 0) lines.push(`Durações em intervalo: ${report.collapsedDurations.length}`);
  if (report.droppedValues.length > 0) lines.push(`Linhas com valores descartados: ${report.droppedValues.length}`);
  if (report.notes.length > 0) lines.push(`Notas: ${report.notes.length}`);
  if (report.ignored.dirigentesBlocks > 0) lines.push(`Blocos de Dirigentes ignorados (sem objetivos): ${report.ignored.dirigentesBlocks}`);
  const unmappedSdgs = Object.keys(report.unmapped.sdgs).length;
  if (unmappedSdgs) lines.push(`ODS não mapeados: ${unmappedSdgs}`);
  return lines.join('\n');
}
