import { spawnSync } from 'node:child_process';
import postgres from 'postgres';
import { E2E_DATABASE_URL } from './e2e-env';

/**
 * Prepares the Playwright database (scout_toolkit_e2e) before the web servers start:
 * applies the current schema and seeds the catalogue when it is empty.
 * Playwright never writes to scout_toolkit_dev.
 */
export default async function globalSetup() {
  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };

  const push = spawnSync('npx', ['drizzle-kit', 'push', '--force', '--strict=false'], {
    stdio: 'inherit',
    shell: true,
    env,
  });
  if (push.status !== 0) {
    throw new Error(`Could not apply the schema to ${redact(E2E_DATABASE_URL)}`);
  }

  // Reference data (Matriz objectives and desafios) is loaded on every run.
  const reference = spawnSync('npx', ['tsx', 'scripts/load-reference-data.ts'], {
    stdio: 'inherit',
    shell: true,
    env,
  });
  if (reference.status !== 0) {
    throw new Error('Could not load the reference data into the e2e database');
  }

  const sql = postgres(E2E_DATABASE_URL, { max: 1 });
  try {
    const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from activities`;
    if (n === 0) {
      const seed = spawnSync('npx', ['tsx', 'drizzle/seeds/index.ts'], {
        stdio: 'inherit',
        shell: true,
        env,
      });
      if (seed.status !== 0) {
        throw new Error('Could not seed the e2e database');
      }
    }
  } finally {
    await sql.end();
  }
}

function redact(url: string) {
  return url.replace(/\/\/[^@]*@/, '//***@');
}
