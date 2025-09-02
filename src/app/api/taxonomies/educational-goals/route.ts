import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { educationalGoals, educationalAreas } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('area_id');

    const baseQuery = db
      .select({
        id: educationalGoals.id,
        title: educationalGoals.title,
        description: educationalGoals.description,
        code: educationalGoals.code,
        area: {
          id: educationalAreas.id,
          name: educationalAreas.name,
          icon: educationalAreas.icon,
          code: educationalAreas.code,
        },
      })
      .from(educationalGoals)
      .leftJoin(educationalAreas, eq(educationalGoals.area_id, educationalAreas.id));

    const query = areaId 
      ? baseQuery.where(eq(educationalGoals.area_id, areaId))
      : baseQuery;

    const goals = await query.orderBy(educationalGoals.code);

    return NextResponse.json({ educational_goals: goals });
  } catch (error) {
    console.error('Error fetching educational goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch educational goals' },
      { status: 500 }
    );
  }
}
