/**
 * Read-only check before the activity types are dropped (openspec: format-focus-everywhere): lists the
 * activities that have no format or no main focus, and the edit suggestions for the former `activity_types`
 * field that are still pending. Writes nothing.
 *
 * Usage: tsx scripts/check-activity-kinds.ts [--allow-remote]
 */
import { sql } from 'drizzle-orm';
import { client, db } from '@/lib/db/server';

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? 'postgres://localhost/x').hostname;
  if (!['localhost', '127.0.0.1'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`Recusado: DATABASE_URL aponta para "${host}", que não é local. Use --allow-remote.`);
  }

  const incomplete = (await db.execute(
    sql`select name, external_id, format_id is null as no_format, focus_id is null as no_focus
        from activities where format_id is null or focus_id is null order by name`
  )) as unknown as Array<{ name: string; external_id: string | null; no_format: boolean; no_focus: boolean }>;
  const [{ total }] = (await db.execute(sql`select count(*)::int as total from activities`)) as unknown as Array<{ total: number }>;
  const pending = (await db.execute(
    sql`select count(*)::int as n from edit_suggestions where field = 'activity_types' and status = 'pending'`
  )) as unknown as Array<{ n: number }>;

  console.log(`Atividades: ${total}; sem formato ou sem foco principal: ${incomplete.length}`);
  for (const row of incomplete) {
    const missing = [row.no_format ? 'formato' : null, row.no_focus ? 'foco' : null].filter(Boolean).join(' e ');
    console.log(`  - ${row.name}${row.external_id ? ` (${row.external_id})` : ''}: falta ${missing}`);
  }
  console.log(`Sugestões pendentes sobre o tipo de atividade (a migração rejeita-as): ${pending[0]?.n ?? 0}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
