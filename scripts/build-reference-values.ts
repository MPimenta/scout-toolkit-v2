/**
 * Rebuilds drizzle/seeds/data/activity-formats.json and activity-focuses.json from the reference
 * sheet export (tabs "formatos" and "focos") and checks the committed source priorities against
 * the "fontes" tab. The sheet is the definitive reference: run this after the team edits it,
 * review the diff and commit.
 *
 * Usage: npx tsx scripts/build-reference-values.ts data/atividades.xlsx
 *   (File > Download > Microsoft Excel from the Google Sheet; `data/` is untracked)
 *
 * It fails on a tab with a missing column or a duplicate code, and exits non-zero when the
 * priorities in activity-sources.json differ from the sheet (it never rewrites that file).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { slugCode } from '../src/lib/reference-data/slug-code';

const OUT_DIR = path.join(process.cwd(), 'drizzle', 'seeds', 'data');
const SOURCE_NOTE = 'Folha de atividades, separadores "formatos" e "focos"';

function die(message: string): never {
  console.error(`build-reference-values: ${message}`);
  process.exit(1);
}

function readTab(workbook: XLSX.WorkBook, tab: string, nameColumn: string): { code: string; name: string; description: string; position: number }[] {
  const sheet = workbook.Sheets[tab];
  if (!sheet) die(`tab "${tab}" not found`);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
  const values = rows
    .map((row) => ({ name: String(row[nameColumn] ?? '').trim(), description: String(row['descrição'] ?? '').trim() }))
    .filter((row) => row.name);
  if (values.length === 0) die(`tab "${tab}" has no values`);
  const codes = new Set<string>();
  return values.map((value, index) => {
    if (!value.description) die(`tab "${tab}": "${value.name}" has no description`);
    const code = slugCode(value.name);
    if (codes.has(code)) die(`tab "${tab}": duplicate code "${code}"`);
    codes.add(code);
    return { code, name: value.name, description: value.description, position: index + 1 };
  });
}

function main() {
  const [sheetPath] = process.argv.slice(2);
  if (!sheetPath) die('usage: npx tsx scripts/build-reference-values.ts <reference-sheet.xlsx>');
  const workbook = XLSX.read(readFileSync(sheetPath), { type: 'buffer' });

  const formats = readTab(workbook, 'formatos', 'formato');
  const focuses = readTab(workbook, 'focos', 'foco');
  const write = (file: string, key: string, values: unknown[]) =>
    writeFileSync(path.join(OUT_DIR, file), `${JSON.stringify({ version: 1, source: SOURCE_NOTE, [key]: values }, null, 2)}\n`);
  write('activity-formats.json', 'formats', formats);
  write('activity-focuses.json', 'focuses', focuses);
  console.log(`formats ${formats.length}, focuses ${focuses.length}`);

  // Source priorities: reported, never rewritten.
  const sourcesFile = path.join(OUT_DIR, 'activity-sources.json');
  const committed = new Map(
    (JSON.parse(readFileSync(sourcesFile, 'utf8')) as { sources: { code: string; priority: number | null }[] }).sources.map((s) => [s.code, s.priority])
  );
  const sheet = workbook.Sheets['fontes'];
  if (!sheet) die('tab "fontes" not found');
  const differences: string[] = [];
  for (const row of XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })) {
    const code = String(row['fonte_id'] ?? '').trim();
    if (!code) continue;
    const raw = String(row['prioridade'] ?? '').trim();
    const priority = /^\d+$/.test(raw) ? Number(raw) : null; // "excluída" and blanks have no priority
    if (!committed.has(code)) differences.push(`${code}: in the sheet but not in activity-sources.json`);
    else if (committed.get(code) !== priority) differences.push(`${code}: sheet ${priority ?? 'none'}, committed ${committed.get(code) ?? 'none'}`);
  }
  if (differences.length > 0) {
    console.error(`Source priorities differ from the sheet:\n  - ${differences.join('\n  - ')}`);
    process.exit(1);
  }
  console.log('Source priorities match the sheet');
}

main();
