import { spawnSync } from 'node:child_process';
import postgres from 'postgres';

if (!process.env.VERCEL) {
  process.exit(0);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn('Skipping hosted schema apply — DATABASE_URL is not set');
  process.exit(0);
}

console.log('Applying schema to the hosted database');
const push = spawnSync('npx', ['drizzle-kit', 'push', '--force'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
if (push.status !== 0) {
  process.exit(push.status ?? 1);
}

const sql = postgres(url, { max: 1 });
try {
  const [{ n }] = await sql`select count(*)::int as n from activities`;
  if (n > 0) {
    console.log(`Hosted database already has ${n} activities`);
  } else {
    console.log('Empty catalogue — seeding');
    const seed = spawnSync('npx', ['tsx', 'drizzle/seeds/index.ts'], {
      stdio: 'inherit',
      shell: true,
      env: process.env,
    });
    if (seed.status !== 0) {
      process.exit(seed.status ?? 1);
    }
  }
} finally {
  await sql.end({ timeout: 5 });
}
