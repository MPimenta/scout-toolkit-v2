import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activities, activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs, educationalAreas } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Activity ID is required' },
        { status: 400 }
      );
    }

    // Fetch the main activity data
    const activityData = await db
      .select({
        id: activities.id,
        name: activities.name,
        description: activities.description,
        materials: activities.materials,
        approximate_duration_minutes: activities.approximate_duration_minutes,
        group_size: activities.group_size,
        effort_level: activities.effort_level,
        location: activities.location,
        age_group: activities.age_group,
        image_url: activities.image_url,
        created_at: activities.created_at,
        updated_at: activities.updated_at,
        activity_type: {
          id: activityTypes.id,
          name: activityTypes.name,
          description: activityTypes.description,
        },
      })
      .from(activities)
      .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
      .where(eq(activities.id, id))
      .limit(1);

    if (activityData.length === 0) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const activity = activityData[0];

    // Fetch educational goals with their areas
    const goals = await db
      .select({
        id: educationalGoals.id,
        title: educationalGoals.title,
        description: educationalGoals.description,
        code: educationalGoals.code,
        area: {
          id: educationalAreas.id,
          name: educationalAreas.name,
          description: educationalAreas.description,
          icon: educationalAreas.icon,
          code: educationalAreas.code,
        },
      })
      .from(activityEducationalGoals)
      .leftJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
      .leftJoin(educationalAreas, eq(educationalGoals.area_id, educationalAreas.id))
      .where(eq(activityEducationalGoals.activity_id, id));

    // Fetch SDGs
    const sdgData = await db
      .select({
        id: sdgs.id,
        number: sdgs.number,
        name: sdgs.name,
        description: sdgs.description,
        icon_url: sdgs.icon_url,
      })
      .from(activitySdgs)
      .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
      .where(eq(activitySdgs.activity_id, id));

    // Combine all data
    const activityWithDetails = {
      ...activity,
      educational_goals: goals,
      sdgs: sdgData,
    };

    return NextResponse.json(activityWithDetails);
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
