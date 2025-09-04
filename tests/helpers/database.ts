import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import { setupTestDatabase, resetTestDatabase } from '../setup'
import * as schema from '../../drizzle/schema'

export async function withTestDatabase() {
  const db = await setupTestDatabase()
  
  return {
    db,
    async cleanup() {
      await resetTestDatabase()
    }
  }
}

export async function createTestUser(db: ReturnType<typeof drizzle>) {
  return await db.insert(schema.user).values({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  }).returning()
}

export async function createTestActivity(db: ReturnType<typeof drizzle>) {
  // First create required dependencies
  const activityType = await db.insert(schema.activityTypes).values({
    id: 'test-activity-type',
    name: 'Test Activity Type',
    description: 'Test description'
  }).returning()

  const activity = await db.insert(schema.activities).values({
    id: 'test-activity',
    name: 'Test Activity',
    description: 'Test activity description',
    materials: 'Test materials',
    approximate_duration_minutes: 30,
    group_size: 'medium',
    effort_level: 'low',
    location: 'inside',
    age_group: 'scouts',
    activity_type_id: activityType[0].id,
    is_approved: true
  }).returning()

  return { activity: activity[0], activityType: activityType[0] }
}

export async function createTestProgram(db: ReturnType<typeof drizzle>, userId: string) {
  const program = await db.insert(schema.programs).values({
    id: 'test-program',
    name: 'Test Program',
    description: 'Test program description',
    start_date: new Date('2025-01-01'),
    start_time: '09:00',
    duration_hours: 2,
    is_public: false,
    user_id: userId
  }).returning()

  return program[0]
}
