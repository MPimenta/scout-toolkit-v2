import { and, asc, desc, eq, ilike, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities, programEntries, programs, user } from '../../../drizzle/schema';

export const DURATION_BANDS = {
  short: sql`COALESCE(SUM(CASE
    WHEN ${programEntries.entry_type} = 'activity' THEN ${activities.approximate_duration_minutes}
    WHEN ${programEntries.entry_type} = 'custom' THEN ${programEntries.custom_duration_minutes}
    ELSE 0 END), 0) < 60`,
  medium: sql`COALESCE(SUM(CASE
    WHEN ${programEntries.entry_type} = 'activity' THEN ${activities.approximate_duration_minutes}
    WHEN ${programEntries.entry_type} = 'custom' THEN ${programEntries.custom_duration_minutes}
    ELSE 0 END), 0) BETWEEN 60 AND 180`,
  long: sql`COALESCE(SUM(CASE
    WHEN ${programEntries.entry_type} = 'activity' THEN ${activities.approximate_duration_minutes}
    WHEN ${programEntries.entry_type} = 'custom' THEN ${programEntries.custom_duration_minutes}
    ELSE 0 END), 0) > 180`,
} as const;

export type DurationBand = keyof typeof DURATION_BANDS;

const durationSql = sql<number>`COALESCE(SUM(CASE
  WHEN ${programEntries.entry_type} = 'activity' THEN ${activities.approximate_duration_minutes}
  WHEN ${programEntries.entry_type} = 'custom' THEN ${programEntries.custom_duration_minutes}
  ELSE 0 END), 0)`;

export async function listPublicPrograms(options: {
  search?: string;
  hasDate?: boolean;
  duration?: DurationBand;
  page: number;
  limit: number;
  sort: 'name' | 'date' | 'created_at';
  order: 'asc' | 'desc';
}) {
  const conditions = [eq(programs.is_public, true)];
  if (options.search) {
    conditions.push(ilike(programs.name, `%${options.search}%`));
  }
  if (options.hasDate === true) {
    conditions.push(sql`${programs.date} IS NOT NULL`);
  } else if (options.hasDate === false) {
    conditions.push(sql`${programs.date} IS NULL`);
  }

  const orderColumn =
    options.sort === 'date'
      ? programs.date
      : options.sort === 'created_at'
        ? programs.created_at
        : programs.name;
  const orderBy = options.order === 'desc' ? desc(orderColumn) : asc(orderColumn);
  const base = db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      created_at: programs.created_at,
      author_name: user.name,
      entry_count: sql<number>`COUNT(${programEntries.id})`,
      total_duration_minutes: durationSql,
    })
    .from(programs)
    .leftJoin(programEntries, eq(programs.id, programEntries.program_id))
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .leftJoin(user, eq(programs.user_id, user.id))
    .where(and(...conditions))
    .groupBy(programs.id, programs.name, programs.date, programs.start_time, programs.created_at, user.name);

  const filtered = options.duration ? base.having(DURATION_BANDS[options.duration]) : base;
  const rows = await filtered
    .orderBy(orderBy)
    .limit(options.limit)
    .offset((options.page - 1) * options.limit);

  const totalCount = await db
    .select({ count: count() })
    .from(programs)
    .where(and(...conditions));

  return {
    programs: rows.map((row) => ({
      ...row,
      author_name: row.author_name || 'Dirigente',
    })),
    pagination: {
      page: options.page,
      limit: options.limit,
      total: totalCount[0]?.count || 0,
      total_pages: Math.ceil((totalCount[0]?.count || 0) / options.limit),
    },
  };
}

export async function getPublicProgram(id: string) {
  const [programRow] = await db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      is_public: programs.is_public,
      created_at: programs.created_at,
      author_name: user.name,
    })
    .from(programs)
    .leftJoin(user, eq(programs.user_id, user.id))
    .where(and(eq(programs.id, id), eq(programs.is_public, true)))
    .limit(1);

  if (!programRow) return null;

  const entries = await db
    .select({
      id: programEntries.id,
      position: programEntries.position,
      start_time: programEntries.start_time,
      end_time: programEntries.end_time,
      entry_type: programEntries.entry_type,
      custom_title: programEntries.custom_title,
      custom_duration_minutes: programEntries.custom_duration_minutes,
      activity_id: programEntries.activity_id,
      activity_name: activities.name,
      activity_duration: activities.approximate_duration_minutes,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .where(eq(programEntries.program_id, id))
    .orderBy(asc(programEntries.position));

  const totalDuration = entries.reduce((sum, entry) => {
    if (entry.entry_type === 'activity') return sum + (entry.activity_duration || 0);
    return sum + (entry.custom_duration_minutes || 0);
  }, 0);

  return {
    ...programRow,
    author_name: programRow.author_name || 'Dirigente',
    entries,
    summary: {
      entry_count: entries.length,
      total_duration_minutes: totalDuration,
    },
  };
}
