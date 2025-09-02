import { NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activities, activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs } from '../../../../drizzle/schema';
import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search');
    const groupSize = searchParams.get('group_size')?.split(',') as ('small' | 'medium' | 'large')[] | undefined;
    const effortLevel = searchParams.get('effort_level')?.split(',') as ('low' | 'medium' | 'high')[] | undefined;
    const location = searchParams.get('location') as 'inside' | 'outside' | null;
    const ageGroup = searchParams.get('age_group')?.split(',') as ('cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders')[] | undefined;
    const activityType = searchParams.get('activity_type')?.split(',') as string[] | undefined;
    const sdgIds = searchParams.get('sdgs')?.split(',') as string[] | undefined;
    const educationalGoalIds = searchParams.get('educational_goals')?.split(',') as string[] | undefined;
    const durationMin = searchParams.get('duration_min');
    const durationMax = searchParams.get('duration_max');
    const durationOperator = searchParams.get('duration_operator') as '>=' | '<=' | '=' | '>' | '<' | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') as 'name' | 'duration' | 'created_at' | undefined;
    const order = searchParams.get('order') as 'asc' | 'desc' | undefined;

    // Build where conditions
    const whereConditions = [eq(activities.is_approved, true)];

    // Text search using simple ILIKE instead of full-text search to avoid JSONB issues
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereConditions.push(
        sql`(${activities.name}::text ILIKE ${`%${searchTerm}%`} OR ${activities.description}::text ILIKE ${`%${searchTerm}%`} OR ${activities.materials}::text ILIKE ${`%${searchTerm}%`})`
      );
    }

    // Filter by group size
    if (groupSize && groupSize.length > 0) {
      whereConditions.push(inArray(activities.group_size, groupSize));
    }

    // Filter by effort level
    if (effortLevel && effortLevel.length > 0) {
      whereConditions.push(inArray(activities.effort_level, effortLevel));
    }

    // Filter by location
    if (location) {
      whereConditions.push(eq(activities.location, location));
    }

    // Filter by age group
    if (ageGroup && ageGroup.length > 0) {
      whereConditions.push(inArray(activities.age_group, ageGroup));
    }

    // Filter by activity type
    if (activityType && activityType.length > 0) {
      whereConditions.push(inArray(activities.activity_type_id, activityType));
    }

    // Filter by duration
    if (durationMin || durationMax) {
      if (durationMin && durationMax) {
        // Range filter: min <= duration <= max
        whereConditions.push(
          sql`${activities.approximate_duration_minutes} >= ${parseInt(durationMin!)} AND ${activities.approximate_duration_minutes} <= ${parseInt(durationMax!)}`
        );
      } else if (durationMin) {
        // Min filter
        const operator = durationOperator || '>=';
        whereConditions.push(
          sql`${activities.approximate_duration_minutes} ${operator} ${parseInt(durationMin!)}`
        );
      } else if (durationMax) {
        // Max filter
        const operator = durationOperator || '<=';
        whereConditions.push(
          sql`${activities.approximate_duration_minutes} ${operator} ${parseInt(durationMax!)}`
        );
      }
    }

    // Build order by clause
    let orderByClause;
    if (sort === 'duration') {
      orderByClause = order === 'desc' ? desc(activities.approximate_duration_minutes) : asc(activities.approximate_duration_minutes);
    } else if (sort === 'created_at') {
      orderByClause = order === 'desc' ? desc(activities.created_at) : asc(activities.created_at);
    } else {
      // Default: sort by name
      orderByClause = order === 'desc' ? desc(activities.name) : asc(activities.name);
    }

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
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset((page - 1) * limit);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(and(...whereConditions));

    // For each activity, fetch related educational goals and SDGs
    const activitiesWithDetails = await Promise.all(
      activitiesData.map(async (activity) => {
        try {
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
        } catch (detailError) {
          console.error(`Error fetching details for activity ${activity.id}:`, detailError);
          // Return activity with empty arrays if details fail
          return {
            ...activity,
            educational_goals: [],
            sdgs: [],
          };
        }
      })
    );

    // Apply client-side filtering for SDGs and educational goals if provided
    let filteredActivities = activitiesWithDetails;
    
    if (sdgIds && sdgIds.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.sdgs.some(sdg => sdgIds.includes(sdg.id))
      );
    }

    if (educationalGoalIds && educationalGoalIds.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.educational_goals.some(goal => educationalGoalIds.includes(goal.id))
      );
    }

    // Get available filter options for the current result set
    const availableFilters = {
      group_sizes: [...new Set(filteredActivities.map(a => a.group_size))],
      effort_levels: [...new Set(filteredActivities.map(a => a.effort_level))],
      locations: [...new Set(filteredActivities.map(a => a.location))],
      age_groups: [...new Set(filteredActivities.map(a => a.age_group))],
      activity_types: [...new Set(filteredActivities.map(a => a.activity_type?.id).filter(Boolean))],
    };

    return NextResponse.json({
      activities: filteredActivities,
      pagination: {
        page,
        limit,
        total: totalCount[0]?.count || 0,
        total_pages: Math.ceil((totalCount[0]?.count || 0) / limit),
      },
      filters: {
        applied: {
          search: search || undefined,
          group_size: groupSize || undefined,
          effort_level: effortLevel || undefined,
          location: location || undefined,
          age_group: ageGroup || undefined,
          activity_type: activityType || undefined,
          sdgs: sdgIds || undefined,
          educational_goals: educationalGoalIds || undefined,
          duration_min: durationMin || undefined,
          duration_max: durationMax || undefined,
          duration_operator: durationOperator || undefined,
        },
        available: availableFilters,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
