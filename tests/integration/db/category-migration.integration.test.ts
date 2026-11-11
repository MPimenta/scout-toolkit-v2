import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';

// Applies the multi-value-categories migration to a throwaway schema that holds the
// old table shape, so the shared test tables are never touched.
const TEST_DATABASE_URL = 'postgresql://test_user:test_password@localhost:5432/scout_toolkit_test';
const SCHEMA = 'category_migration_check';

const ACTIVITY_ID = '550e8400-e29b-41d4-a716-446655441001';
const TYPE_ID = '550e8400-e29b-41d4-a716-446655441002';
const USER_ID = '550e8400-e29b-41d4-a716-446655441003';

function migrationSql() {
  const dir = path.join(process.cwd(), 'drizzle', 'migrations');
  const file = readdirSync(dir).find((name) => name.startsWith('0002_') && name.endsWith('.sql'));
  if (!file) throw new Error('multi-value categories migration (0002_*.sql) not found');
  return readFileSync(path.join(dir, file), 'utf8')
    .replace(/"public"\./g, `"${SCHEMA}".`)
    .split('--> statement-breakpoint');
}

describe('multi-value categories migration', () => {
  let sql: postgres.Sql;

  beforeAll(async () => {
    requireLocalTestDatabase();
    sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
    await sql.unsafe(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await sql.unsafe(`CREATE SCHEMA ${SCHEMA}`);
    await sql.unsafe(`SET search_path TO ${SCHEMA}`);
    // Old shape: single-valued columns on activities.
    await sql.unsafe(`
      CREATE TABLE activity_types (id uuid PRIMARY KEY, name text NOT NULL);
      CREATE TABLE activities (
        id uuid PRIMARY KEY, name text NOT NULL,
        group_size text NOT NULL, location text NOT NULL, age_group text NOT NULL,
        activity_type_id uuid NOT NULL,
        is_approved boolean NOT NULL DEFAULT true, created_at timestamp NOT NULL DEFAULT now(),
        effort_level text NOT NULL DEFAULT 'low'
      );
      ALTER TABLE activities ADD CONSTRAINT activities_activity_type_id_activity_types_id_fk
        FOREIGN KEY (activity_type_id) REFERENCES activity_types(id);
      CREATE INDEX activities_group_size_idx ON activities(group_size);
      CREATE INDEX activities_location_idx ON activities(location);
      CREATE INDEX activities_age_group_idx ON activities(age_group);
      CREATE INDEX activities_activity_type_id_idx ON activities(activity_type_id);
      CREATE INDEX activities_filter_idx ON activities(is_approved, group_size, effort_level, location, age_group);
      CREATE TABLE edit_suggestions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(), activity_id uuid NOT NULL, user_id uuid NOT NULL,
        field text NOT NULL, suggested_value text NOT NULL, status text NOT NULL DEFAULT 'pending'
      );
    `);
    await sql`INSERT INTO activity_types (id, name) VALUES (${TYPE_ID}, 'Jogo')`;
    await sql`INSERT INTO activities (id, name, group_size, location, age_group, activity_type_id)
              VALUES (${ACTIVITY_ID}, 'Antiga', 'large', 'outside', 'rovers', ${TYPE_ID})`;
    await sql`INSERT INTO edit_suggestions (activity_id, user_id, field, suggested_value, status) VALUES
      (${ACTIVITY_ID}, ${USER_ID}, 'age_group', 'scouts', 'pending'),
      (${ACTIVITY_ID}, ${USER_ID}, 'location', 'garden', 'pending'),
      (${ACTIVITY_ID}, ${USER_ID}, 'group_size', 'small', 'approved'),
      (${ACTIVITY_ID}, ${USER_ID}, 'description', 'Texto', 'pending')`;

    for (const statement of migrationSql()) {
      if (statement.trim()) await sql.unsafe(statement);
    }
  });

  afterAll(async () => {
    await sql.unsafe(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await sql.end();
  });

  it('turns each existing single value into exactly one link', async () => {
    const q = async (table: string, column: string) =>
      (await sql.unsafe(`SELECT ${column} AS v FROM ${SCHEMA}.${table} WHERE activity_id = '${ACTIVITY_ID}'`)).map((r) => r.v);
    expect(await q('activity_group_sizes', 'group_size')).toEqual(['large']);
    expect(await q('activity_locations', 'location')).toEqual(['outside']);
    expect(await q('activity_age_groups', 'age_group')).toEqual(['rovers']);
    expect(await q('activity_activity_types', 'activity_type_id')).toEqual([TYPE_ID]);
  });

  it('drops the old single-valued columns', async () => {
    const columns = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = ${SCHEMA} AND table_name = 'activities'`;
    const names = columns.map((c) => c.column_name);
    for (const gone of ['group_size', 'location', 'age_group', 'activity_type_id']) {
      expect(names).not.toContain(gone);
    }
    expect(names).toContain('effort_level');
  });

  it('rewrites pending suggestions to plural keys with list values and rejects unusable ones', async () => {
    const rows = await sql`SELECT field, suggested_value, status FROM edit_suggestions ORDER BY field`;
    const byField = Object.fromEntries(rows.map((r) => [r.field + ':' + r.status, r.suggested_value]));
    expect(byField['age_groups:pending']).toBe('["scouts"]');
    // an invalid pending value cannot become a list: rejected, key unchanged
    expect(byField['location:rejected']).toBe('garden');
    // already-decided and unrelated suggestions are untouched
    expect(byField['group_size:approved']).toBe('small');
    expect(byField['description:pending']).toBe('Texto');
  });
});
