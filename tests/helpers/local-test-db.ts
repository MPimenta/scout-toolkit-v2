import postgres from 'postgres'

const TEST_DATABASE_URL =
  'postgresql://test_user:test_password@localhost:5432/scout_toolkit_test'

let probe: Promise<boolean> | null = null

/**
 * True when the dedicated local test database is reachable.
 * Do not use Neon / .env.local here — those integration files insert and truncate.
 */
export function probeLocalTestDatabase(): Promise<boolean> {
  if (!probe) {
    probe = (async () => {
      const sql = postgres(TEST_DATABASE_URL, {
        max: 1,
        connect_timeout: 2,
      })
      try {
        await sql`SELECT 1`
        return true
      } catch {
        return false
      } finally {
        await sql.end({ timeout: 1 }).catch(() => undefined)
      }
    })()
  }

  return probe
}

export function shouldSkipLocalTestDatabase(): boolean {
  return process.env.SCOUT_HAS_LOCAL_TEST_DB !== '1'
}

export function requireLocalTestDatabase() {
  if (process.env.SCOUT_HAS_LOCAL_TEST_DB === '1') {
    return
  }
  throw new Error(
    'scout_toolkit_test is unreachable. Start local Postgres (npm run db:start) and ensure database scout_toolkit_test exists for test_user. Never point SQL-integration tests at Neon.'
  )
}
