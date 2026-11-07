import { drizzle } from 'drizzle-orm/postgres-js'
import { insertActivities } from './activity-categories'
import { setupTestDatabase, resetTestDatabase } from '../setup'
import * as schema from '../../drizzle/schema'

export type TestDatabaseHandle = { db: Awaited<ReturnType<typeof setupTestDatabase>>; cleanup(): Promise<void> }

/**
 * Without a callback: sets up the test DB and returns it with a cleanup().
 * With a callback: sets up the DB, runs the callback, then resets the DB.
 */
export async function withTestDatabase(): Promise<TestDatabaseHandle>
export async function withTestDatabase(fn: () => Promise<void>): Promise<void>
export async function withTestDatabase(fn?: () => Promise<void>): Promise<TestDatabaseHandle | void> {
  const db = await setupTestDatabase()

  if (fn) {
    try {
      await fn()
    } finally {
      await resetTestDatabase()
    }
    return
  }

  return {
    db,
    async cleanup() {
      await resetTestDatabase()
    }
  }
}

export async function createTestUser(db: ReturnType<typeof drizzle>) {
  return await db.insert(schema.user).values({
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    name: 'Test User'
  }).returning()
}

export async function createTestActivity(db: ReturnType<typeof drizzle>) {
  // First create required dependencies
  const activityType = await db.insert(schema.activityTypes).values({
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Test Activity Type',
    description: 'Test description'
  }).returning()

  const activity = await insertActivities(db, {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Test Activity',
    description: 'Test activity description',
    materials: 'Test materials',
    approximate_duration_minutes: 30,
    group_sizes: ['medium'],
    effort_level: 'low',
    locations: ['inside'],
    age_groups: ['scouts'],
    activity_type_id: activityType[0].id,
    is_approved: true
  })

  return { activity: activity[0], activityType: activityType[0] }
}

export async function createTestProgram(db: ReturnType<typeof drizzle>, userId: string) {
  const program = await db.insert(schema.programs).values({
    name: 'Test Program',
    date: '2025-01-01',
    start_time: '09:00',
    is_public: false,
    user_id: userId
  }).returning()

  return program[0]
}

export async function createTestReview(
  db: ReturnType<typeof drizzle>,
  activityId: string,
  userId: string,
  rating = 4,
  comment = 'Boa atividade'
) {
  return db.insert(schema.reviews).values({
    activity_id: activityId,
    user_id: userId,
    rating,
    comment,
  }).returning()
}
