import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activitySources } from '../../../../../drizzle/schema';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const sources = await db.select().from(activitySources).orderBy(asc(activitySources.name));
    return NextResponse.json({ activity_sources: sources });
  } catch (error) {
    return handleApiError(error, 'Error fetching activity sources:');
  }
}
