import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { challengeTypes } from '../../../../../drizzle/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db.select().from(challengeTypes).orderBy(asc(challengeTypes.name));
  return NextResponse.json({ challenge_types: rows });
}
