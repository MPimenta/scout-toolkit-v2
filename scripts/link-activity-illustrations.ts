/**
 * Gives sheet activities the existing hand-drawn illustration of the same name.
 * `public/activity-illustrations/<slug>.png` is matched to the activity name; only activities
 * with an empty `image_url` are touched. Idempotent. Usage: tsx scripts/link-activity-illustrations.ts [--dry-run] [--allow-remote]
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { client, db } from '@/lib/db/server';
import { activities } from '../drizzle/schema';

const DIR = path.join(process.cwd(), 'public', 'activity-illustrations');

export function illustrationSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const host = new URL(process.env.DATABASE_URL ?? 'postgres://localhost/x').hostname;
  if (!['localhost', '127.0.0.1'].includes(host) && !process.argv.includes('--allow-remote')) {
    throw new Error(`Recusado: DATABASE_URL aponta para "${host}", que não é local. Use --allow-remote.`);
  }
  const dry = process.argv.includes('--dry-run');
  const rows = await db
    .select({ id: activities.id, name: activities.name })
    .from(activities)
    .where(and(isNotNull(activities.external_id), isNull(activities.image_url)));
  let linked = 0;
  for (const row of rows) {
    const slug = illustrationSlug(row.name);
    if (!slug || !existsSync(path.join(DIR, `${slug}.png`))) continue;
    linked++;
    if (!dry) await db.update(activities).set({ image_url: `/activity-illustrations/${slug}.png` }).where(eq(activities.id, row.id));
  }
  console.log(`${dry ? 'Previsto' : 'Resultado'}: ${linked} de ${rows.length} atividades da folha sem imagem ligadas a uma ilustração existente`);
  await client.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
