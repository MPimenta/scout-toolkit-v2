/**
 * Loads a curated activities sheet into the catalogue (a realistic test baseline).
 *
 * LOCAL ONLY by default: it refuses any DATABASE_URL whose host is not localhost.
 * Running it without --dry-run changes data; only do so deliberately.
 *
 * How to get the input
 *   1. Open the Google Sheet and select the `atividades` tab.
 *   2. File > Download > Comma Separated Values (.csv) (or Microsoft Excel .xlsx).
 *   3. Save it under `data/` (untracked, listed in .gitignore). Never commit it:
 *      some sources in the sheet are copyrighted.
 *
 * Usage
 *   npm run db:load-baseline -- data/atividades.csv --dry-run
 *   npm run db:load-baseline -- data/atividades.csv --limit 200
 *   npm run db:load-baseline -- data/atividades.csv --replace
 *
 * Flags
 *   --dry-run            plan and report only, never touch the database
 *   --limit <n>          activities to select (default 200)
 *   --seed <n>           selection seed (default 1)
 *   --replace            delete every existing activity first
 *   --force              with --replace: also delete activities that programs use
 *                        (their entries keep the slot but lose the activity)
 *   --report <file>      JSON report path (default data/baseline-report.json)
 *   --allow-remote       permit a non-local DATABASE_URL (strongly discouraged)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { planBaselineLoad, summarizeReport, type SheetRow } from '../src/lib/activities/baseline-plan';

dotenv.config({ path: '.env.local', override: false });

type Args = {
  file: string;
  dryRun: boolean;
  limit: number;
  seed: number;
  replace: boolean;
  force: boolean;
  allowRemote: boolean;
  report: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    file: '',
    dryRun: false,
    limit: 200,
    seed: 1,
    replace: false,
    force: false,
    allowRemote: false,
    report: 'data/baseline-report.json',
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--replace') args.replace = true;
    else if (arg === '--force') args.force = true;
    else if (arg === '--allow-remote') args.allowRemote = true;
    else if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg === '--seed') args.seed = Number(argv[++i]);
    else if (arg === '--report') args.report = String(argv[++i]);
    else if (!arg.startsWith('--') && !args.file) args.file = arg;
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }
  if (!args.file) throw new Error('Indique o ficheiro exportado (.csv ou .xlsx).');
  if (!Number.isInteger(args.limit) || args.limit < 1) throw new Error('--limit inválido');
  if (!Number.isInteger(args.seed)) throw new Error('--seed inválido');
  return args;
}

function databaseHost(): string | null {
  const url = process.env['DATABASE_URL'];
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function readSheet(file: string): { headers: string[]; rows: SheetRow[] } {
  // CSV is decoded as UTF-8 explicitly (the library would assume a legacy code page).
  const workbook = file.toLowerCase().endsWith('.csv')
    ? XLSX.read(readFileSync(file, 'utf8'), { type: 'string', raw: false })
    : XLSX.read(readFileSync(file), { type: 'buffer', raw: false });
  const sheetName =
    workbook.SheetNames.find((name) => name.trim().toLowerCase() === 'atividades') ?? workbook.SheetNames[0]!;
  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<SheetRow>(sheet, { defval: '', raw: false });
  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })[0] ?? [];
  return { headers: headerRow.map(String), rows };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Guard first: nothing below may connect to a non-local database, not even for a dry run.
  const host = databaseHost();
  const local = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (!local && !args.allowRemote) {
    console.error(
      `Recusado: DATABASE_URL aponta para "${host ?? 'desconhecido'}", que não é local. ` +
        'Use uma base local ou --allow-remote (não recomendado).'
    );
    process.exit(2);
  }

  const { headers, rows } = readSheet(args.file);

  // Dry runs still read the database (taxonomies, existing activities) but never write.
  const db = await import('../src/lib/activities/baseline-db');
  const taxonomies = await db.loadTaxonomies();
  const existing = args.replace ? [] : await db.loadExistingActivities();

  const plan = planBaselineLoad(headers, rows, taxonomies, { limit: args.limit, seed: args.seed, existing });
  if (plan.missingColumns) {
    console.error('Faltam colunas obrigatórias no ficheiro:\n  - ' + plan.missingColumns.join('\n  - '));
    process.exit(3);
  }

  let loaded: number | undefined;
  if (!args.dryRun) {
    if (args.replace) {
      const referenced = await db.findReferencedActivities();
      if (referenced.length > 0 && !args.force) {
        console.error(
          `Recusado: ${referenced.length} atividade(s) estão em programas. Use --force para as apagar na mesma:\n  - ` +
            referenced.map((a) => a.name).join('\n  - ')
        );
        process.exit(4);
      }
      const removed = await db.deleteAllActivities();
      console.log(`Apagadas ${removed} atividades existentes.`);
    }
    loaded = await db.insertSelection(plan.selected);
  }

  mkdirSync(path.dirname(args.report), { recursive: true });
  writeFileSync(
    args.report,
    JSON.stringify({ ...plan.report, dryRun: args.dryRun, loaded: loaded ?? 0 }, null, 2)
  );
  console.log(summarizeReport(plan.report, loaded));
  console.log(`Relatório: ${args.report}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
