import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activities, activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs } from '../../../../drizzle/schema';
import { eq, and, inArray, desc, asc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Cap at 100 for performance
    const sort = searchParams.get('sort') as 'name' | 'duration' | 'created_at' | undefined;
    const order = searchParams.get('order') as 'asc' | 'desc' | undefined;

    // Build where conditions
    const whereConditions = [eq(activities.is_approved, true)];

    // Text search using simple ILIKE with optimized pattern matching
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Use a more efficient search pattern - avoid leading wildcards when possible
      const searchPattern = searchTerm.includes(' ') ? `%${searchTerm}%` : `${searchTerm}%`;
      whereConditions.push(
        sql`(${activities.name}::text ILIKE ${searchPattern} OR ${activities.description}::text ILIKE ${searchPattern} OR ${activities.materials}::text ILIKE ${searchPattern})`
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

    // First, get the activity IDs that match our filters (for efficient pagination)
    const activityIds = await db
      .select({ id: activities.id })
      .from(activities)
      .where(and(...whereConditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset((page - 1) * limit);

    if (activityIds.length === 0) {
      return NextResponse.json({
        activities: [],
        pagination: {
          page,
          limit,
          total: 0,
          total_pages: 0,
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
          available: {
            group_sizes: [],
            effort_levels: [],
            locations: [],
            age_groups: [],
            activity_types: [],
          },
        },
      });
    }

    const activityIdList = activityIds.map(a => a.id);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(activities)
      .where(and(...whereConditions));

    // Fetch all activities with their activity types in one query
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
      .where(inArray(activities.id, activityIdList))
      .orderBy(orderByClause);

    // Fetch all educational goals for these activities in one query
    const allEducationalGoals = await db
      .select({
        activity_id: activityEducationalGoals.activity_id,
        id: educationalGoals.id,
        title: educationalGoals.title,
        code: educationalGoals.code,
      })
      .from(activityEducationalGoals)
      .leftJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
      .where(inArray(activityEducationalGoals.activity_id, activityIdList));

    // Fetch all SDGs for these activities in one query
    const allSdgs = await db
      .select({
        activity_id: activitySdgs.activity_id,
        id: sdgs.id,
        number: sdgs.number,
        name: sdgs.name,
        icon_url: sdgs.icon_url,
        icon: sdgs.icon,
      })
      .from(activitySdgs)
      .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
      .where(inArray(activitySdgs.activity_id, activityIdList));

    // Group the related data by activity ID
    const goalsByActivity = allEducationalGoals.reduce((acc, goal) => {
      if (!acc[goal.activity_id]) acc[goal.activity_id] = [];
      if (goal.id) { // Only add if goal.id is not null
        acc[goal.activity_id].push({
          id: goal.id,
          title: goal.title || '',
          code: goal.code || '',
        });
      }
      return acc;
    }, {} as Record<string, Array<{ id: string; title: string; code: string }>>);

    const sdgsByActivity = allSdgs.reduce((acc, sdg) => {
      if (!acc[sdg.activity_id]) acc[sdg.activity_id] = [];
      if (sdg.id) { // Only add if sdg.id is not null
        acc[sdg.activity_id].push({
          id: sdg.id,
          number: sdg.number || 0,
          name: sdg.name || '',
          icon_url: sdg.icon_url || '',
          icon: sdg.icon || '',
        });
      }
      return acc;
    }, {} as Record<string, Array<{ id: string; number: number; name: string; icon_url: string; icon: string }>>);

    // Combine all data
    const activitiesWithDetails = activitiesData.map(activity => ({
      ...activity,
      educational_goals: goalsByActivity[activity.id] || [],
      sdgs: sdgsByActivity[activity.id] || [],
    }));

    // Apply client-side filtering for SDGs and educational goals if provided
    let filteredActivities = activitiesWithDetails;
    
    if (sdgIds && sdgIds.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.sdgs.some(sdg => sdg.id && sdgIds.includes(sdg.id))
      );
    }

    if (educationalGoalIds && educationalGoalIds.length > 0) {
      filteredActivities = filteredActivities.filter(activity => 
        activity.educational_goals.some(goal => goal.id && educationalGoalIds.includes(goal.id))
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
