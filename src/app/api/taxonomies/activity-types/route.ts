import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activityTypes } from '../../../../../drizzle/schema';

export async function GET() {
  try {
    const types = await db
      .select({
        id: activityTypes.id,
        name: activityTypes.name,
        description: activityTypes.description,
      })
      .from(activityTypes)
      .orderBy(activityTypes.name);

    return NextResponse.json({ activity_types: types });
  } catch (error) {
    console.error('Error fetching activity types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity types' },
      { status: 500 }
    );
  }
}
