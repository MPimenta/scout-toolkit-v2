// Runs before `next build` on Vercel (Preview and Production).
//
// 1. If the database already has the app tables but no Drizzle migration history
//    (it was created with `drizzle-kit push` before migrations were committed),
//    check it matches the baseline migration and record the baseline as applied.
//    A mismatch fails the deploy with a list of differences.
// 2. Apply committed migrations that have not run yet (`drizzle-kit migrate`).
//    Never `push --force`: nothing is dropped unless a committed migration drops it.
// 3. Load the reference data (Matriz objectives and desafios) on every deploy; it is idempotent.
// 4. Seed the catalogue if it is empty.
//
// Locally it does nothing unless ENSURE_HOSTED_DB_FORCE=1 (used to test this script).
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';

if (!process.env.VERCEL && process.env.ENSURE_HOSTED_DB_FORCE !== '1') {
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn('Skipping hosted schema apply: DATABASE_URL is not set');
  process.exit(0);
}

const MIGRATIONS_DIR = 'drizzle/migrations';
const journal = JSON.parse(readFileSync(`${MIGRATIONS_DIR}/meta/_journal.json`, 'utf8'));
const baseline = journal.entries[0];
const baselineSnapshot = JSON.parse(
  readFileSync(`${MIGRATIONS_DIR}/meta/${String(baseline.idx).padStart(4, '0')}_snapshot.json`, 'utf8')
);

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: true, env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

/** Expected public-schema columns from the baseline snapshot, as "table.column". */
function baselineColumns() {
  const out = new Set();
  for (const table of Object.values(baselineSnapshot.tables)) {
    if ((table.schema || 'public') !== 'public') continue;
    for (const column of Object.keys(table.columns)) out.add(`${table.name}.${column}`);
  }
  return out;
}

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  const [{ has_app_tables }] = await sql`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'activities'
    ) as has_app_tables`;
  const [{ has_history }] = await sql`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'drizzle' and table_name = '__drizzle_migrations'
    ) as has_history`;
  const appliedCount = has_history
    ? (await sql`select count(*)::int as n from drizzle.__drizzle_migrations`)[0].n
    : 0;

  if (has_app_tables && appliedCount === 0) {
    console.log('Existing database without migration history: checking it against the baseline');
    const rows = await sql`
      select table_name || '.' || column_name as col
      from information_schema.columns
      where table_schema = 'public'`;
    const actual = new Set(rows.map((r) => r.col));
    const expected = baselineColumns();
    const missing = [...expected].filter((c) => !actual.has(c)).sort();
    const extra = [...actual].filter((c) => !expected.has(c)).sort();
    if (missing.length || extra.length) {
      console.error('The database does not match the baseline migration. Fix it by hand, then redeploy.');
      if (missing.length) console.error(`Missing columns:\n  ${missing.join('\n  ')}`);
      if (extra.length) console.error(`Unexpected columns:\n  ${extra.join('\n  ')}`);
      process.exit(1);
    }
    const hash = createHash('sha256')
      .update(readFileSync(`${MIGRATIONS_DIR}/${baseline.tag}.sql`, 'utf8'))
      .digest('hex');
    await sql`create schema if not exists drizzle`;
    await sql`
      create table if not exists drizzle.__drizzle_migrations (
        id serial primary key,
        hash text not null,
        created_at bigint
      )`;
    await sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${hash}, ${baseline.when})`;
    console.log(`Recorded ${baseline.tag} as already applied`);
  }
} finally {
  await sql.end({ timeout: 5 });
}

console.log('Applying committed migrations');
run('npx', ['drizzle-kit', 'migrate']);

console.log('Loading reference data (Matriz)');
run('npx', ['tsx', 'scripts/load-reference-data.ts']);

const seedCheck = postgres(url, { max: 1 });
try {
  const [{ n }] = await seedCheck`select count(*)::int as n from activities`;
  if (n > 0) {
    console.log(`Hosted database already has ${n} activities`);
  } else {
    console.log('Empty catalogue: seeding');
    run('npx', ['tsx', 'drizzle/seeds/index.ts']);
  }
} finally {
  await seedCheck.end({ timeout: 5 });
}
