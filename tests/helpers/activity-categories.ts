import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../../drizzle/schema'
import type {
  AgeGroupValue,
  GroupSizeValue,
  LocationValue,
} from '../../drizzle/schema/category-values'

type TestDb = PostgresJsDatabase<typeof schema> | PostgresJsDatabase<Record<string, unknown>>

export type ActivityFixture = typeof schema.activities.$inferInsert & {
  group_sizes?: GroupSizeValue[]
  locations?: LocationValue[]
  age_groups?: AgeGroupValue[]
  activity_type_id?: string
  activity_type_ids?: string[]
}

/**
 * Inserts activities together with their category links (the multi-valued
 * category columns no longer live on `activities`). Defaults give every activity
 * one value per category, as the app requires, except activity types which are
 * only linked when an id is passed.
 */
export async function insertActivities(db: TestDb, input: ActivityFixture | ActivityFixture[]) {
  const list = Array.isArray(input) ? input : [input]
  const rows = await db
    .insert(schema.activities)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- category fields are stored in link tables
    .values(list.map(({ group_sizes, locations, age_groups, activity_type_id, activity_type_ids, ...row }) => row))
    .returning()

  for (const [index, row] of rows.entries()) {
    const source = list[index]
    const typeIds = source.activity_type_ids ?? (source.activity_type_id ? [source.activity_type_id] : [])
    await db.insert(schema.activityGroupSizes).values(
      (source.group_sizes ?? ['medium']).map((group_size) => ({ activity_id: row.id, group_size }))
    )
    await db.insert(schema.activityLocations).values(
      (source.locations ?? ['inside']).map((location) => ({ activity_id: row.id, location }))
    )
    await db.insert(schema.activityAgeGroups).values(
      (source.age_groups ?? ['scouts']).map((age_group) => ({ activity_id: row.id, age_group }))
    )
    if (typeIds.length > 0) {
      await db.insert(schema.activityActivityTypes).values(
        typeIds.map((activity_type_id) => ({ activity_id: row.id, activity_type_id }))
      )
    }
  }
  return rows
}
