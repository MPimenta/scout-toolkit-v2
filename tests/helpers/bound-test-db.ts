import type { drizzle } from 'drizzle-orm/postgres-js'

type TestDb = ReturnType<typeof drizzle>

export const boundTestDb: { current: TestDb | null } = {
  current: null,
}

export function getBoundTestDb(): TestDb {
  if (!boundTestDb.current) {
    throw new Error('boundTestDb.current is not set. Call setupTestDatabase() in beforeAll first.')
  }
  return boundTestDb.current
}
