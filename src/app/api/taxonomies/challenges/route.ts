import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { challenges, challengeTypes } from '../../../../../drizzle/schema';
import { asc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db
    .select({
      id: challenges.id,
      name: challenges.name,
      description: challenges.description,
      type: {
        id: challengeTypes.id,
        name: challengeTypes.name,
      },
    })
    .from(challenges)
    .innerJoin(challengeTypes, eq(challenges.type_id, challengeTypes.id))
    .orderBy(asc(challenges.name));
  return NextResponse.json({ challenges: rows });
}
