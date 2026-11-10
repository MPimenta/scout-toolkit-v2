import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activities, educationalGoals, sdgs, activityEducationalGoals, activitySdgs } from '../../../../drizzle/schema';
import { eq, and, or, inArray, desc, asc, sql, ilike, exists, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { apiErrors, handleApiError } from '@/lib/errors';
import { loadGoalAgeGroups } from '@/lib/activities/goals';
import { formatFocusConditions, loadFormatFocus } from '@/lib/activities/format-focus';
import { createActivity, parseActivityWrite, verifyActivityExtras, verifyActivityGoals, verifyActivityTypes, verifyFormatAndFocus } from '@/lib/activities/write';
import { categoryConditions, loadActivityCategories } from '@/lib/activities/categories';
import { AGE_GROUP_VALUES, GROUP_SIZE_VALUES, LOCATION_VALUES } from '@/lib/activities/category-values';
import { featureOffResponse } from '@/lib/feature-gate';

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get activities with filtering and pagination
 *     description: Retrieve a paginated list of activities with advanced filtering options
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for activity name, description, or materials
 *       - in: query
 *         name: group_size
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [small, medium, large]
 *         style: form
 *         explode: false
 *         description: Filter by group size
 *       - in: query
 *         name: effort_level
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [low, medium, high]
 *         style: form
 *         explode: false
 *         description: Filter by effort level
 *       - in: query
 *         name: location
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [inside, outside]
 *         style: form
 *         explode: false
 *         description: Filter by location (activities matching any selected value)
 *       - in: query
 *         name: age_group
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [cub_scouts, scouts, adventurers, rovers, leaders]
 *         style: form
 *         explode: false
 *         description: Filter by age group
 *       - in: query
 *         name: format
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by format IDs (any of them)
 *       - in: query
 *         name: focus
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by focus IDs (main or secondary focus, any of them)
 *       - in: query
 *         name: activity_type
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by activity type IDs
 *       - in: query
 *         name: sdgs
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by SDG IDs
 *       - in: query
 *         name: educational_goals
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by specific objective IDs (matches any selected objective)
 *       - in: query
 *         name: general_objectives
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by general objective IDs (any objective under them)
 *       - in: query
 *         name: educational_areas
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: false
 *         description: Filter by educational area IDs (any objective in them). Combined with the objective filters by OR
 *       - in: query
 *         name: duration_min
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum duration in minutes (inclusive)
 *       - in: query
 *         name: duration_max
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum duration in minutes (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of activities per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, duration, created_at]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     applied:
 *                       type: object
 *                       description: Currently applied filters
 *                     available:
 *                       type: object
 *                       description: Available filter options for current result set
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/** Comma-separated query value -> validated list (absent stays undefined). */
const list = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess(
    (value) =>
      typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value,
    z.array(item).min(1).optional()
  );

const catalogueQuerySchema = z.object({
  search: z.string().trim().max(200).optional().transform((v) => v || undefined),
  group_size: list(z.enum(GROUP_SIZE_VALUES)),
  effort_level: list(z.enum(['low', 'medium', 'high'])),
  location: list(z.enum(LOCATION_VALUES)),
  age_group: list(z.enum(AGE_GROUP_VALUES)),
  activity_type: list(z.string().uuid()),
  // Format (what kind of activity) and focus (main or secondary), from the reference sheet.
  format: list(z.string().uuid()),
  focus: list(z.string().uuid()),
  sdgs: list(z.string().uuid()),
  // Objective filters: an activity matches when it is linked to ANY objective selected by id,
  // under a selected general objective, or under a selected area.
  educational_goals: list(z.string().uuid()),
  educational_areas: list(z.string().uuid()),
  general_objectives: list(z.string().uuid()),
  // Both bounds are inclusive and either may be omitted.
  duration_min: z.coerce.number().int().min(0).optional(),
  duration_max: z.coerce.number().int().min(0).optional(),
  // Deprecated: accepted and ignored (the catalogue no longer sends it).
  duration_operator: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Larger requests are capped at 100 (as before), not rejected.
  limit: z.coerce.number().int().min(1).transform((n) => Math.min(n, 100)).default(20),
  sort: z.enum(['name', 'duration', 'created_at']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

function parseCatalogueQuery(searchParams: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(catalogueQuerySchema.shape)) {
    const value = searchParams.get(key);
    if (value !== null && value !== '') raw[key] = value;
  }
  return catalogueQuerySchema.safeParse(raw);
}

/** Escapes LIKE wildcards so "50%" searches for the literal text. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => '\\' + char);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const parsed = parseCatalogueQuery(searchParams);
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0] ?? 'query');
      return apiErrors.validation(field, 'Parâmetro de pesquisa inválido: ' + field);
    }
    const {
      search,
      group_size: groupSize,
      effort_level: effortLevel,
      location,
      age_group: ageGroup,
      activity_type: activityType,
      format: formatIds,
      focus: focusIds,
      sdgs: sdgIds,
      educational_goals: educationalGoalIds,
      educational_areas: educationalAreaIds,
      general_objectives: generalObjectiveIds,
      duration_min: durationMin,
      duration_max: durationMax,
      page,
      limit,
      sort,
      order,
    } = parsed.data;

    // Build where conditions. Every filter runs in SQL before counting and paginating.
    const whereConditions = [eq(activities.is_approved, true)];

    // Text search: the term anywhere in name, description or materials, ignoring case.
    if (search) {
      const pattern = '%' + escapeLike(search) + '%';
      whereConditions.push(
        or(
          ilike(activities.name, pattern),
          ilike(activities.description, pattern),
          ilike(activities.materials, pattern)
        )!
      );
    }

    if (effortLevel) whereConditions.push(inArray(activities.effort_level, effortLevel));
    whereConditions.push(...formatFocusConditions({ formatIds, focusIds }));
    whereConditions.push(
      ...categoryConditions({
        groupSizes: groupSize,
        locations: location,
        ageGroups: ageGroup,
        activityTypeIds: activityType,
      })
    );

    if (sdgIds) {
      whereConditions.push(
        exists(
          db
            .select({ one: sql`1` })
            .from(activitySdgs)
            .where(and(eq(activitySdgs.activity_id, activities.id), inArray(activitySdgs.sdg_id, sdgIds)))
        )
      );
    }
    if (educationalGoalIds || educationalAreaIds || generalObjectiveIds) {
      const objectiveMatch = or(
        educationalGoalIds ? inArray(educationalGoals.id, educationalGoalIds) : undefined,
        educationalAreaIds ? inArray(educationalGoals.area_id, educationalAreaIds) : undefined,
        generalObjectiveIds ? inArray(educationalGoals.general_objective_id, generalObjectiveIds) : undefined
      )!;
      whereConditions.push(
        exists(
          db
            .select({ one: sql`1` })
            .from(activityEducationalGoals)
            .innerJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
            .where(and(eq(activityEducationalGoals.activity_id, activities.id), objectiveMatch))
        )
      );
    }

    // Duration: inclusive bounds, either may be omitted.
    const duration = activities.approximate_duration_minutes;
    if (durationMin !== undefined) whereConditions.push(gte(duration, durationMin));
    if (durationMax !== undefined) whereConditions.push(lte(duration, durationMax));

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
            format: formatIds || undefined,
            focus: focusIds || undefined,
            sdgs: sdgIds || undefined,
            educational_goals: educationalGoalIds || undefined,
            educational_areas: educationalAreaIds || undefined,
            general_objectives: generalObjectiveIds || undefined,
            duration_min: durationMin || undefined,
            duration_max: durationMax || undefined,
          },
          available: {
            group_sizes: [],
            effort_levels: [],
            locations: [],
            age_groups: [],
            activity_types: [],
            formats: [],
            focuses: [],
          },
        },
      });
    }

    const activityIdList = activityIds.map(a => a.id);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql<number>`count(*)::int` })
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
        duration_min_minutes: activities.duration_min_minutes,
        duration_max_minutes: activities.duration_max_minutes,
        effort_level: activities.effort_level,
        image_url: activities.image_url,
        format_id: activities.format_id,
        focus_id: activities.focus_id,
        secondary_focus_id: activities.secondary_focus_id,
        created_at: activities.created_at,
      })
      .from(activities)
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

    const goalAgeGroups = await loadGoalAgeGroups(allEducationalGoals.flatMap((g) => (g.id ? [g.id] : [])));

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
      // A goal linked for two divisions is listed once.
      if (goal.id && !acc[goal.activity_id].some((existing) => existing.id === goal.id)) {
        acc[goal.activity_id].push({
          id: goal.id,
          title: goal.title || '',
          code: goal.code || '',
          age_groups: goalAgeGroups.get(goal.id) ?? [],
        });
      }
      return acc;
    }, {} as Record<string, Array<{ id: string; title: string; code: string; age_groups: string[] }>>);

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

    const categoriesByActivity = await loadActivityCategories(activityIdList);
    const formatFocusByActivity = await loadFormatFocus(activitiesData);

    // Combine all data
    const activitiesWithDetails = activitiesData.map(({ format_id: _f, focus_id: _o, secondary_focus_id: _s, ...activity }) => ({
      ...activity,
      ...formatFocusByActivity.get(activity.id)!,
      group_sizes: categoriesByActivity.get(activity.id)!.group_sizes,
      locations: categoriesByActivity.get(activity.id)!.locations,
      age_groups: categoriesByActivity.get(activity.id)!.age_groups,
      activity_types: categoriesByActivity.get(activity.id)!.activity_types,
      educational_goals: goalsByActivity[activity.id] || [],
      sdgs: sdgsByActivity[activity.id] || [],
    }));

    const filteredActivities = activitiesWithDetails;

    // Get available filter options for the current result set
    const availableFilters = {
      group_sizes: [...new Set(filteredActivities.flatMap(a => a.group_sizes))],
      effort_levels: [...new Set(filteredActivities.map(a => a.effort_level))],
      locations: [...new Set(filteredActivities.flatMap(a => a.locations))],
      age_groups: [...new Set(filteredActivities.flatMap(a => a.age_groups))],
      activity_types: [...new Set(filteredActivities.flatMap(a => a.activity_types.map(t => t.id)))],
      formats: [...new Set(filteredActivities.flatMap(a => (a.format ? [a.format.id] : [])))],
      focuses: [...new Set(filteredActivities.flatMap(a => [a.focus?.id, a.secondary_focus?.id].filter(Boolean)))],
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
          format: formatIds || undefined,
          focus: focusIds || undefined,
          sdgs: sdgIds || undefined,
          educational_goals: educationalGoalIds || undefined,
            educational_areas: educationalAreaIds || undefined,
            general_objectives: generalObjectiveIds || undefined,
          duration_min: durationMin || undefined,
          duration_max: durationMax || undefined,
        },
        available: availableFilters,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Error fetching activities:');
  }
}

export async function POST(request: NextRequest) {
  // Creating an activity here is a member proposal; admins use /api/admin/activities.
  const hidden = featureOffResponse('activity-proposals');
  if (hidden) return hidden;

  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const parsed = parseActivityWrite(await request.json());
  if (typeof parsed === 'string') {
    return apiErrors.validation('body', parsed);
  }

  const typeError = await verifyActivityTypes(parsed);
  if (typeError) return apiErrors.validation('body', typeError);

  const formatFocusError = await verifyFormatAndFocus(parsed);
  if (formatFocusError) return apiErrors.validation('body', formatFocusError);

  const goalError = await verifyActivityGoals(parsed);
  if (goalError) return apiErrors.validation('body', goalError);

  const extrasError = await verifyActivityExtras(parsed);
  if (extrasError) return apiErrors.validation('body', extrasError);

  const activity = await createActivity(parsed, {
    createdBy: session.user.id,
    isApproved: false,
  });
  return NextResponse.json({ activity }, { status: 201 });
}
