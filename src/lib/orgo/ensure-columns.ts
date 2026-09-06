import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/server';

let ensured = false;

export async function ensureOrgoProgramColumns(): Promise<void> {
  if (ensured) return;
  await db.execute(sql`ALTER TABLE programs ADD COLUMN IF NOT EXISTS orgo_event_uuid text`);
  await db.execute(sql`ALTER TABLE programs ADD COLUMN IF NOT EXISTS orgo_event_url text`);
  ensured = true;
}
