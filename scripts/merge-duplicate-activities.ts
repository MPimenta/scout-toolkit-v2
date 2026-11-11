/**
 * Removes the original (demo) activities that the reference sheet now carries under the same name.
 * Programs, reviews, edit suggestions and usage events that point to an original are moved to its
 * sheet copy first; the original is then deleted. Originals with no sheet copy are left alone.
 * Usage: tsx scripts/merge-duplicate-activities.ts [--dry-run] [--allow-remote]
 */
import { client } from '@/lib/db/server';

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? 'postgres://localhost/x').hostname;
  if (!['localhost', '127.0.0.1'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`Recusado: DATABASE_URL aponta para "${host}", que não é local. Use --allow-remote.`);
  }
  const dry = process.argv.includes('--dry-run');
  await client.begin(async (tx) => {
    await tx`create temp table dup_map on commit drop as
      select o.id as old_id, min(s.id::text)::uuid as new_id
      from activities o join activities s on lower(s.name) = lower(o.name) and s.external_id is not null
      where o.external_id is null group by o.id`;
    const [{ n }] = await tx`select count(*)::int as n from dup_map`;
    const moved: Record<string, number> = {};
    const run = async (label: string, rows: ArrayLike<unknown>) => { moved[label] = rows.length; };
    await run('program_entries', await tx`update program_entries t set activity_id = m.new_id from dup_map m where t.activity_id = m.old_id returning t.id`);
    await run('edit_suggestions', await tx`update edit_suggestions t set activity_id = m.new_id from dup_map m where t.activity_id = m.old_id returning t.id`);
    await run('usage_events', await tx`update usage_events t set activity_id = m.new_id from dup_map m where t.activity_id = m.old_id returning t.id`);
    await run('reviews', await tx`update reviews t set activity_id = m.new_id from dup_map m where t.activity_id = m.old_id
      and not exists (select 1 from reviews r where r.activity_id = m.new_id and r.user_id = t.user_id) returning t.id`);
    const deleted = await tx`delete from activities where id in (select old_id from dup_map) returning id`;
    console.log(`${dry ? 'Previsto' : 'Resultado'}: ${n} originais com cópia da folha; movidos ${JSON.stringify(moved)}; apagados ${deleted.length}`);
    if (dry) throw new Error('dry-run');
  }).catch((error) => {
    if (!(error instanceof Error && error.message === 'dry-run')) throw error;
  });
  await client.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
