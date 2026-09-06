import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { educationalAreas } from '../../../../../drizzle/schema';

export async function GET() {
  const areas = await db.select().from(educationalAreas);
  return NextResponse.json({ educational_areas: areas });
}
