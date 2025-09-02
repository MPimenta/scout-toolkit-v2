import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activities, activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // For now, we'll fetch all approved activities without complex filtering
    // Advanced filtering will be implemented in Story 3.2: Search & Filtering
    
    // Fetch activities with their activity types
    const activitiesData = await db
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
        activity_type: {
          id: activityTypes.id,
          name: activityTypes.name,
        },
      })
      .from(activities)
      .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
      .where(eq(activities.is_approved, true));

    // For each activity, fetch related educational goals and SDGs
    const activitiesWithDetails = await Promise.all(
      activitiesData.map(async (activity) => {
        // Fetch educational goals
        const goals = await db
          .select({
            id: educationalGoals.id,
            title: educationalGoals.title,
            code: educationalGoals.code,
          })
          .from(activityEducationalGoals)
          .leftJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
          .where(eq(activityEducationalGoals.activity_id, activity.id));

        // Fetch SDGs
        const sdgData = await db
          .select({
            id: sdgs.id,
            number: sdgs.number,
            name: sdgs.name,
            icon_url: sdgs.icon_url,
          })
          .from(activitySdgs)
          .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
          .where(eq(activitySdgs.activity_id, activity.id));

        return {
          ...activity,
          educational_goals: goals,
          sdgs: sdgData,
        };
      })
    );

    return NextResponse.json({
      activities: activitiesWithDetails,
      total: activitiesWithDetails.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
