/**
 * Builds drizzle/seeds/data/progress-matrix.json (and the reconciliation report)
 * from the Matriz Progresso Pessoal workbook and the Regulamento do Programa
 * para Jovens text.
 *
 * Usage: tsx scripts/build-progress-matrix.ts <workbook.xlsx> <regulamento.pdf>
 *
 * The Regulamento is read with `pdftotext -layout -enc UTF-8` (poppler/xpdf),
 * a developer-only tool; deploys never run this script, they load the committed JSON.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import {
  MATRIX_AREAS,
  MATRIX_CHALLENGE_TYPES,
  MATRIX_PATHS,
  STAGE_AGE_GROUP,
} from '../drizzle/seeds/data/progress-matrix-structure';
import { parseObjectiveCode } from '../src/lib/reference-data/objective-code';
import type { ProgressMatrixDataset, MatrixGoal } from '../src/lib/reference-data/progress-matrix-types';

const OUT_DIR = path.join(process.cwd(), 'drizzle', 'seeds', 'data');

function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cell(value: unknown): string {
  return String(value ?? '').replace(/\r/g, '').trim();
}

function die(message: string): never {
  console.error(`build-progress-matrix: ${message}`);
  process.exit(1);
}

/** "1A.2. Texto" -> { code: "1A.2", text: "Texto" } (the code ends with a dot before the text). */
function splitCodeAndText(raw: string): { code: string; text: string } | null {
  const match = /^(\S+?)\.?\s+([\s\S]+)$/.exec(raw.trim());
  if (!match) return null;
  return { code: match[1].replace(/\.$/, ''), text: match[2].replace(/\s+/g, ' ').trim() };
}

function buildObjectives(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets['Objetivos'];
  if (!sheet) die('sheet "Objetivos" not found');
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });

  const generalObjectives = new Map<string, { code: string; area: string; title: string; position: number }>();
  const goals = new Map<string, MatrixGoal>();
  const textClashes: string[] = [];
  let currentGeneral: string | null = null;

  for (const row of rows.slice(2)) {
    const first = cell(row[0]);
    const specificCells = [1, 2, 3, 4].map((c) => cell(row[c]));
    if (!first && specificCells.every((c) => !c)) continue;

    if (first) {
      const parsed = splitCodeAndText(first);
      if (!parsed || !/^\d[ACEFIS]$/.test(parsed.code)) die(`bad general objective cell: "${first}"`);
      currentGeneral = parsed.code;
      generalObjectives.set(parsed.code, {
        code: parsed.code,
        area: parsed.code.slice(-1),
        title: parsed.text,
        position: generalObjectives.size + 1,
      });
    }
    if (!currentGeneral) die('specific objective row before any general objective');

    specificCells.forEach((raw, index) => {
      if (!raw || /sem objetivo espec/i.test(raw)) return;
      const parsed = splitCodeAndText(raw);
      if (!parsed) die(`bad specific objective cell: "${raw}"`);
      const code = parseObjectiveCode(parsed.code);
      if (!code) die(`unparseable objective code "${parsed.code}"`);
      if (code.general !== currentGeneral) {
        die(`objective ${parsed.code} sits under general objective ${currentGeneral}`);
      }
      const columnStage = index + 1;
      if (!code.stages.includes(columnStage)) {
        die(`objective ${parsed.code} is in the column of stage ${columnStage} but its code says ${code.stages.join('-')}`);
      }
      const ageGroups = code.stages.map((s) => STAGE_AGE_GROUP[s as 1 | 2 | 3 | 4]);
      const existing = goals.get(code.canonical);
      if (existing) {
        if (existing.title !== parsed.text) textClashes.push(code.canonical);
        return;
      }
      goals.set(code.canonical, {
        code: code.canonical,
        general_objective_code: currentGeneral!,
        area_code: code.area,
        title: parsed.text,
        age_groups: ageGroups,
        position: goals.size + 1,
      });
    });
  }
  if (textClashes.length) die(`shared objective text differs between columns: ${textClashes.join(', ')}`);
  return { generalObjectives: [...generalObjectives.values()], goals: [...goals.values()] };
}

type SheetReport = {
  /** Objectives whose text in the reference sheet differs from the workbook (the sheet wins). */
  objectiveTextChanges: { code: string; workbook: string; sheet: string }[];
  /** Desafios whose links differ between matrix v1.0 (the workbook) and v1.1 (the sheet, which wins). */
  challengeLinkChanges: { code: string; v10: string[]; v11: string[] }[];
  challengesWithIntegration: number;
};

const INTEGRATION_LABELS: Record<string, (typeof STAGE_AGE_GROUP)[1 | 2 | 3 | 4][]> = {
  alcateia: ['cub_scouts'],
  tes: ['scouts'],
  tex: ['adventurers'],
  cla: ['rovers'],
  todos: ['cub_scouts', 'scouts', 'adventurers', 'rovers'],
};

/** "Alcateia, TEs" or "Todos" -> age groups, in division order. */
function parseIntegration(raw: string, where: string): (typeof STAGE_AGE_GROUP)[1 | 2 | 3 | 4][] {
  const out = new Set<(typeof STAGE_AGE_GROUP)[1 | 2 | 3 | 4]>();
  for (const part of raw.split(',').map((p) => p.trim()).filter(Boolean)) {
    const groups = INTEGRATION_LABELS[normalise(part).replace(/\s+/g, '')];
    if (!groups) die(`${where}: unknown integration division "${part}"`);
    groups.forEach((g) => out.add(g));
  }
  const order = ['cub_scouts', 'scouts', 'adventurers', 'rovers'];
  return [...out].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

const INTEGRATION_MARKER = /\s*\[Integra[çc][ãa]o\s+([^\]]*)\]\s*$/;

/**
 * The reference sheet is the definitive source: its objectives tab must have exactly the dataset's
 * objective codes (a mismatch fails), its wording wins, and its desafios tab supplies the short
 * title, the integration divisions and the v1.1 links. The full desafio text stays the workbook's,
 * without the "[Integração …]" marker, which must agree with the sheet's integration cell.
 */
function applySheet(
  sheetWorkbook: XLSX.WorkBook,
  generalObjectives: { code: string; title: string }[],
  goals: MatrixGoal[],
  built: ReturnType<typeof buildChallenges>['challenges'],
  typeNames: Map<string, string>
): { challenges: ProgressMatrixDataset['challenges']; report: SheetReport } {
  const report: SheetReport = { objectiveTextChanges: [], challengeLinkChanges: [], challengesWithIntegration: 0 };
  const squash = (t: unknown) => String(t ?? '').replace(/\s+/g, ' ').trim();

  const objectiveSheet = sheetWorkbook.Sheets['objetivos educativos'];
  if (!objectiveSheet) die('sheet tab "objetivos educativos" not found');
  const objectiveRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(objectiveSheet, { defval: '', raw: false });
  const sheetTexts = new Map<string, string>();
  for (const row of objectiveRows) {
    const code = squash(row['código']);
    if (!code || code.startsWith('[')) continue;
    const text = squash(row['objetivo']);
    if (sheetTexts.has(code) && sheetTexts.get(code) !== text) die(`objectives tab: "${code}" has two different texts`);
    sheetTexts.set(code, text);
  }
  const known = new Set<string>([...goals.map((g) => g.code), ...generalObjectives.map((g) => g.code)]);
  const unknownInSheet = [...sheetTexts.keys()].filter((code) => !known.has(code));
  const missingInSheet = [...known].filter((code) => !sheetTexts.has(code));
  if (unknownInSheet.length || missingInSheet.length) {
    die(`objectives tab differs from the dataset: only in sheet [${unknownInSheet.join(', ')}], only in dataset [${missingInSheet.join(', ')}]`);
  }
  for (const item of [...goals, ...generalObjectives]) {
    const sheetText = sheetTexts.get(item.code)!;
    if (squash(item.title) !== sheetText) {
      report.objectiveTextChanges.push({ code: item.code, workbook: item.title, sheet: sheetText });
      item.title = sheetText;
    }
  }

  const challengeSheet = sheetWorkbook.Sheets['desafios'];
  if (!challengeSheet) die('sheet tab "desafios" not found');
  const challengeRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(challengeSheet, { defval: '', raw: false });
  const byCode = new Map(challengeRows.filter((r) => squash(r['código'])).map((r) => [squash(r['código']), r]));
  if (byCode.size !== built.length) die(`desafios tab has ${byCode.size} desafios, the dataset has ${built.length}`);
  const goalCodes = new Set(goals.map((g) => g.code));

  const challenges = built.map((challenge) => {
    const row = byCode.get(challenge.code);
    if (!row) die(`desafios tab has no desafio ${challenge.code}`);
    const where = `desafio ${challenge.code}`;
    if (normalise(squash(row['tipo'])) !== normalise(typeNames.get(challenge.type_code) ?? '')) die(`${where}: type "${squash(row['tipo'])}" differs from the dataset`);
    const shortTitle = squash(row['desafio']);
    if (!shortTitle) die(`${where}: empty short title`);

    const codes: string[] = [];
    for (const raw of squash(row['objetivos (matriz v1.1)']).split(/[,\s]+/).filter(Boolean)) {
      const parsed = parseObjectiveCode(raw.replace(/\.$/, ''));
      if (!parsed) die(`${where}: unparseable objective "${raw}"`);
      if (!goalCodes.has(parsed.canonical)) die(`${where}: unknown objective ${parsed.canonical}`);
      if (!codes.includes(parsed.canonical)) codes.push(parsed.canonical);
    }
    if (codes.slice().sort().join() !== challenge.goal_codes.slice().sort().join()) {
      report.challengeLinkChanges.push({ code: challenge.code, v10: challenge.goal_codes, v11: codes });
    }

    const integration = parseIntegration(squash(row['integração']), where);
    const marker = INTEGRATION_MARKER.exec(challenge.title);
    const markerGroups = marker ? parseIntegration(marker[1]!, `${where} (text marker)`) : [];
    if (integration.join() !== markerGroups.join()) {
      die(`${where}: integration cell [${integration.join(', ')}] differs from the marker in the text [${markerGroups.join(', ')}]`);
    }
    if (integration.length > 0) report.challengesWithIntegration += 1;

    return {
      ...challenge,
      title: challenge.title.replace(INTEGRATION_MARKER, '').trim(),
      short_title: shortTitle,
      integration_age_groups: integration,
      goal_codes: codes,
    };
  });
  return { challenges, report };
}

function buildChallenges(workbook: XLSX.WorkBook, goalCodes: Set<string>) {
  const sheet = workbook.Sheets['Desafios-Objetivos'];
  if (!sheet) die('sheet "Desafios-Objetivos" not found');
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false });
  const ageByBand = ['cub_scouts', 'scouts', 'adventurers', 'rovers'] as const;
  const challenges: Omit<ProgressMatrixDataset['challenges'][number], 'short_title' | 'integration_age_groups'>[] = [];
  let crossStage = 0;
  let linkCount = 0;

  MATRIX_CHALLENGE_TYPES.forEach((type, typeIndex) => {
    const titleRow = rows[1 + typeIndex * 2];
    const goalRow = rows[2 + typeIndex * 2];
    if (!titleRow || !goalRow || normalise(cell(titleRow[1])) !== normalise(type.name)) {
      die(`challenge type "${type.name}" not found where expected in "Desafios-Objetivos"`);
    }
    for (let column = 0; column < 16; column++) {
      const title = cell(titleRow[3 + column]);
      if (!title) die(`${type.name}, column ${String.fromCharCode(65 + column)}: empty challenge`);
      const ageGroup = ageByBand[Math.floor(column / 4)];
      const stageOfBand = Math.floor(column / 4) + 1;
      const codes: string[] = [];
      let other = false;
      for (const raw of cell(goalRow[3 + column]).split(/\s+/).filter(Boolean)) {
        const parsed = parseObjectiveCode(raw.replace(/\.$/, ''));
        if (!parsed) die(`${type.name}, column ${String.fromCharCode(65 + column)}: unparseable code "${raw}"`);
        if (!goalCodes.has(parsed.canonical)) {
          die(`${type.name}, column ${String.fromCharCode(65 + column)}: unknown objective ${parsed.canonical}`);
        }
        if (!parsed.stages.includes(stageOfBand)) other = true;
        if (!codes.includes(parsed.canonical)) codes.push(parsed.canonical);
      }
      if (other) crossStage++;
      linkCount += codes.length;
      challenges.push({
        code: `${type.code}-${String.fromCharCode(65 + column)}`,
        type_code: type.code,
        age_group: ageGroup,
        position: column + 1,
        title: title.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').trim(),
        goal_codes: codes,
      });
    }
  });
  return { challenges, crossStage, linkCount };
}

interface RegulamentoReport {
  codesInRegulamento: number;
  onlyInRegulamento: string[];
  onlyInWorkbook: string[];
  /** Ranges the Regulamento merges where the workbook lists the stages separately. */
  mergedInRegulamento: string[];
  textDiffers: { code: string; workbook: string; regulamento: string }[];
  verbatimRepeats: { codes: string[]; text: string }[];
  generalObjectiveDiffers: { code: string; workbook: string; regulamento: string }[];
}

function reconcile(pdfPath: string, dataset: ProgressMatrixDataset): RegulamentoReport {
  const text = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  }).replaceAll(String.fromCharCode(13), '');
  // Skip the table of contents: Anexo 1 starts at "Metas Educativas".
  const annexStart = text.lastIndexOf('Metas Educativas');
  const start = text.indexOf('Objetivos Educativos Espec', annexStart);
  const annexEnd = text.indexOf('ANEXO 2', start);
  if (start < 0 || annexEnd < 0) die('could not find Anexo 1 specific objectives in the Regulamento text');
  const specific = text.slice(start, annexEnd);

  const found = new Map<string, string>();
  const byText = new Map<string, string[]>();
  const pattern = /(?<![\w.])(\d[ACEFIS]\d?\.\d(?:\.\d)?(?:-\d)?)\.\s+(.{6,70}?)(?=\s{2,}|$)/gm;
  for (const line of specific.split('\n')) {
    for (const match of line.matchAll(pattern)) {
      const canonical = match[1].replace(/^(\d[ACEFIS])(\d)\.(\d)/, '$1.$2.$3');
      if (!found.has(canonical)) found.set(canonical, match[2]);
    }
  }

  const goalByCode = new Map(dataset.goals.map((g) => [g.code, g]));
  const regCodes = new Set<string>();
  const mergedInRegulamento: string[] = [];
  const alias = (code: string) => {
    // The Regulamento merges 6C.2 and 6C.3 as "6C.2-3" and 4S.2.2/4S.2.3 as "4S.2.2-3".
    const merged = /^(\d[ACEFIS](?:\.\d)?)\.(\d)-(\d)$/.exec(code);
    if (merged && !goalByCode.has(code)) {
      mergedInRegulamento.push(code);
    }
    if (merged && !goalByCode.has(code)) return [`${merged[1]}.${merged[2]}`, `${merged[1]}.${merged[3]}`];
    return [code];
  };
  for (const code of found.keys()) alias(code).forEach((c) => regCodes.add(c));

  const onlyInRegulamento = [...regCodes].filter((c) => !goalByCode.has(c)).sort();
  const onlyInWorkbook = dataset.goals.map((g) => g.code).filter((c) => !regCodes.has(c)).sort();

  const textDiffers: RegulamentoReport['textDiffers'] = [];
  for (const [code, regText] of found) {
    const goal = goalByCode.get(code);
    if (!goal) continue;
    const a = normalise(goal.title).split(' ').slice(0, 3).join(' ');
    const b = normalise(regText).split(' ').slice(0, 3).join(' ');
    if (a !== b) textDiffers.push({ code, workbook: goal.title, regulamento: regText });
    const key = normalise(regText);
    byText.set(key, [...(byText.get(key) ?? []), code]);
  }
  const verbatimRepeats = [...byText.entries()]
    // The same wording across stages of one objective is normal; across objectives it is suspicious (4A.2).
    .filter(([, codes]) => new Set(codes.map((c) => c.slice(0, 2))).size > 1)
    .map(([textKey, codes]) => ({ codes, text: textKey }));

  const generalObjectiveDiffers: RegulamentoReport['generalObjectiveDiffers'] = [];
  const flat = normalise(text.slice(text.indexOf('Objetivos Educativos Gerais', annexStart), start));
  for (const general of dataset.general_objectives) {
    const probe = normalise(general.title).split(' ').slice(0, 5).join(' ');
    if (!flat.includes(probe)) {
      generalObjectiveDiffers.push({ code: general.code, workbook: general.title, regulamento: '(not found)' });
    }
  }

  return {
    codesInRegulamento: regCodes.size,
    onlyInRegulamento,
    onlyInWorkbook,
    mergedInRegulamento: [...new Set(mergedInRegulamento)].sort(),
    textDiffers,
    verbatimRepeats,
    generalObjectiveDiffers,
  };
}

function main() {
  const [workbookPath, pdfPath, sheetPath] = process.argv.slice(2);
  if (!workbookPath || !pdfPath) {
    die('usage: tsx scripts/build-progress-matrix.ts <workbook.xlsx> <regulamento.pdf> <reference-sheet.xlsx>');
  }
  if (!sheetPath) die('the reference sheet export is required (third argument)');
  const workbook = XLSX.read(readFileSync(workbookPath), { type: 'buffer' });

  const { generalObjectives, goals } = buildObjectives(workbook);

  // Paths: every general objective belongs to exactly one.
  const assigned = new Map<string, string>();
  for (const p of MATRIX_PATHS) {
    for (const g of p.generalObjectives) {
      if (assigned.has(g)) die(`general objective ${g} is in two paths`);
      assigned.set(g, p.code);
    }
  }
  for (const g of generalObjectives) {
    if (!assigned.has(g.code)) die(`general objective ${g.code} is in no path`);
  }
  for (const code of assigned.keys()) {
    if (!generalObjectives.some((g) => g.code === code)) die(`path lists unknown general objective ${code}`);
  }

  const built = buildChallenges(workbook, new Set(goals.map((g) => g.code)));
  const sheet = applySheet(
    XLSX.read(readFileSync(sheetPath!), { type: 'buffer' }),
    generalObjectives,
    goals,
    built.challenges,
    new Map(MATRIX_CHALLENGE_TYPES.map((t) => [t.code, t.name]))
  );
  const challenges = sheet.challenges;
  const goalByCode = new Map(goals.map((g) => [g.code, g]));
  const linkCount = challenges.reduce((n, c) => n + c.goal_codes.length, 0);
  // Counted on the final (v1.1) links: a desafio links other stages when an objective excludes its own.
  const crossStage = challenges.filter((c) => c.goal_codes.some((code) => !goalByCode.get(code)!.age_groups.includes(c.age_group))).length;

  const dataset: ProgressMatrixDataset = {
    version: 1,
    sources: {
      workbook: 'Matriz Progresso Pessoal v1.0 (2023-02-02)',
      regulamento: 'Regulamento do Programa para Jovens v1.2 (dezembro 2024)',
      sheet: 'Folha de atividades (atividades_v2), separadores "objetivos educativos" e "desafios" (matriz v1.1)',
    },
    areas: MATRIX_AREAS.map((a, i) => ({ code: a.code, name: a.name, icon: a.icon, position: i + 1 })),
    paths: MATRIX_PATHS.map((p, i) => ({ code: p.code, area_code: p.area, name: p.name, position: i + 1 })),
    general_objectives: generalObjectives.map((g) => ({
      code: g.code,
      area_code: g.area,
      path_code: assigned.get(g.code)!,
      title: g.title,
      position: g.position,
    })),
    goals,
    challenge_types: MATRIX_CHALLENGE_TYPES.map((t, i) => ({ code: t.code, name: t.name, position: i + 1 })),
    challenges,
  };

  const report = reconcile(pdfPath, dataset);

  writeFileSync(path.join(OUT_DIR, 'progress-matrix.json'), `${JSON.stringify(dataset, null, 2)}\n`);
  writeFileSync(
    path.join(OUT_DIR, 'progress-matrix.report.json'),
    `${JSON.stringify(
      {
        totals: {
          areas: dataset.areas.length,
          paths: dataset.paths.length,
          generalObjectives: dataset.general_objectives.length,
          specificObjectives: goals.length,
          sharedObjectives: goals.filter((g) => g.age_groups.length > 1).length,
          challengeTypes: dataset.challenge_types.length,
          challenges: challenges.length,
          links: linkCount,
          challengesLinkingOtherStages: crossStage,
          challengesWithIntegration: sheet.report.challengesWithIntegration,
        },
        sheet: sheet.report,
        regulamento: report,
      },
      null,
      2
    )}\n`
  );

  console.log(
    `areas ${dataset.areas.length}, paths ${dataset.paths.length}, general ${dataset.general_objectives.length}, ` +
      `specific ${goals.length} (shared ${goals.filter((g) => g.age_groups.length > 1).length}), ` +
      `types ${dataset.challenge_types.length}, challenges ${challenges.length}, links ${linkCount}, ` +
      `challenges linking other stages ${crossStage}`
  );
  console.log(
    `Regulamento: ${report.codesInRegulamento} codes; only in Regulamento ${report.onlyInRegulamento.length}, ` +
      `only in workbook ${report.onlyInWorkbook.length}, text differs ${report.textDiffers.length}, ` +
      `verbatim repeats ${report.verbatimRepeats.length}, general objectives not found ${report.generalObjectiveDiffers.length}`
  );
}

main();
