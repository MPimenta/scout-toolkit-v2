import { and, asc, eq, exists, inArray, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  activityActivityTypes,
  activityAgeGroups,
  activityGroupSizes,
  activityLocations,
  activityTypes,
} from '../../../drizzle/schema';
import {
  AGE_GROUP_VALUES,
  GROUP_SIZE_VALUES,
  LOCATION_VALUES,
  type AgeGroupValue,
  type GroupSizeValue,
  type LocationValue,
} from './category-values';

export type ActivityTypeRef = { id: string; name: string };

export type ActivityCategories = {
  group_sizes: GroupSizeValue[];
  locations: LocationValue[];
  age_groups: AgeGroupValue[];
  activity_types: ActivityTypeRef[];
};

function byEnumOrder<T extends string>(order: readonly T[], values: T[]): T[] {
  return [...values].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/**
 * Loads the four category sets for several activities with one query per
 * category. Every requested id is present in the result, with empty arrays when
 * nothing is linked. Values come back in a stable order (enum order; types by name).
 */
export async function loadActivityCategories(
  ids: string[]
): Promise<Map<string, ActivityCategories>> {
  const result = new Map<string, ActivityCategories>();
  for (const id of ids) {
    result.set(id, { group_sizes: [], locations: [], age_groups: [], activity_types: [] });
  }
  if (ids.length === 0) return result;

  const [sizes, locs, ages, types] = await Promise.all([
    db.select().from(activityGroupSizes).where(inArray(activityGroupSizes.activity_id, ids)),
    db.select().from(activityLocations).where(inArray(activityLocations.activity_id, ids)),
    db.select().from(activityAgeGroups).where(inArray(activityAgeGroups.activity_id, ids)),
    db
      .select({
        activity_id: activityActivityTypes.activity_id,
        id: activityTypes.id,
        name: activityTypes.name,
      })
      .from(activityActivityTypes)
      .innerJoin(activityTypes, eq(activityTypes.id, activityActivityTypes.activity_type_id))
      .where(inArray(activityActivityTypes.activity_id, ids))
      .orderBy(asc(activityTypes.name)),
  ]);

  for (const row of sizes) result.get(row.activity_id)?.group_sizes.push(row.group_size);
  for (const row of locs) result.get(row.activity_id)?.locations.push(row.location);
  for (const row of ages) result.get(row.activity_id)?.age_groups.push(row.age_group);
  for (const row of types) result.get(row.activity_id)?.activity_types.push({ id: row.id, name: row.name });

  for (const entry of result.values()) {
    entry.group_sizes = byEnumOrder(GROUP_SIZE_VALUES, entry.group_sizes);
    entry.locations = byEnumOrder(LOCATION_VALUES, entry.locations);
    entry.age_groups = byEnumOrder(AGE_GROUP_VALUES, entry.age_groups);
  }
  return result;
}

export async function loadActivityCategoriesFor(id: string): Promise<ActivityCategories> {
  const map = await loadActivityCategories([id]);
  return map.get(id)!;
}

export type CategoryFilters = {
  groupSizes?: readonly GroupSizeValue[];
  locations?: readonly LocationValue[];
  ageGroups?: readonly AgeGroupValue[];
  activityTypeIds?: readonly string[];
};

/**
 * WHERE conditions for category filters. Each category is an EXISTS over its link
 * table (any selected value matches); categories combine with AND. EXISTS keeps
 * one row per activity so pagination and totals stay correct.
 */
export function categoryConditions(filters: CategoryFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.groupSizes?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityGroupSizes)
          .where(
            and(
              eq(activityGroupSizes.activity_id, activities.id),
              inArray(activityGroupSizes.group_size, [...filters.groupSizes])
            )
          )
      )
    );
  }
  if (filters.locations?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityLocations)
          .where(
            and(
              eq(activityLocations.activity_id, activities.id),
              inArray(activityLocations.location, [...filters.locations])
            )
          )
      )
    );
  }
  if (filters.ageGroups?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityAgeGroups)
          .where(
            and(
              eq(activityAgeGroups.activity_id, activities.id),
              inArray(activityAgeGroups.age_group, [...filters.ageGroups])
            )
          )
      )
    );
  }
  if (filters.activityTypeIds?.length) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(activityActivityTypes)
          .where(
            and(
              eq(activityActivityTypes.activity_id, activities.id),
              inArray(activityActivityTypes.activity_type_id, [...filters.activityTypeIds])
            )
          )
      )
    );
  }
  return conditions;
}
