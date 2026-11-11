import { sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { AGE_GROUP_VALUES } from '@/lib/activities/category-values';
import { NO_DIVISION, type ActivityRow, type UsagePeriod, type UsageSummary } from './analytics-shared';

export { NO_DIVISION, USAGE_PERIODS, type UsagePeriod, type UsageSummary } from './analytics-shared';

const TIME_ZONE = 'Europe/Lisbon';

export function periodStart(period: UsagePeriod, now = new Date()): Date {
  const from = new Date(now);
  if (period === '13m') from.setMonth(from.getMonth() - 13);
  else from.setDate(from.getDate() - { '7d': 7, '30d': 30, '90d': 90 }[period]);
  return from;
}

export function isDivision(value: string): boolean {
  return (AGE_GROUP_VALUES as readonly string[]).includes(value);
}

/** The Lisbon calendar day (YYYY-MM-DD) of a moment. */
export function lisbonDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Every Lisbon day from `from` to `to`, inclusive. */
export function daysBetween(from: Date, to: Date): string[] {
  const days: string[] = [];
  const last = lisbonDay(to);
  for (let cursor = new Date(from); ; cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)) {
    const day = lisbonDay(cursor);
    if (days[days.length - 1] !== day) days.push(day);
    if (day >= last) break;
  }
  return days;
}

async function rows<T>(query: SQL): Promise<T[]> {
  return (await db.execute(query)) as unknown as T[];
}

export async function getUsageSummary(
  period: UsagePeriod,
  division: string | null,
  now = new Date()
): Promise<UsageSummary> {
  const from = periodStart(period, now);
  const fromIso = from.toISOString();

  // Division rule: searches that filtered by it, and views/additions of activities that belong to it.
  const selected = sql`(
    e.occurred_at >= ${fromIso}::timestamptz AND (
      ${division}::text IS NULL
      OR (e.type = 'search' AND jsonb_exists(e.payload->'divisions', ${division}))
      OR (e.type <> 'search' AND EXISTS (
        SELECT 1 FROM activity_age_groups g WHERE g.activity_id = e.activity_id AND g.age_group = ${division}
      ))
    )
  )`;

  const [totalsRows, dailyRows, activityRows, textRows, noResultRows, divisionRows, userRows] = await Promise.all([
    rows<{ searches: string; views: string; adds: string; visitors: string; users: string }>(sql`
      SELECT count(*) FILTER (WHERE e.type = 'search') AS searches,
             count(*) FILTER (WHERE e.type = 'activity_view') AS views,
             count(*) FILTER (WHERE e.type = 'program_add') AS adds,
             count(DISTINCT e.visitor_id) AS visitors,
             count(DISTINCT e.user_id) AS users
      FROM usage_events e WHERE ${selected}`),
    rows<{ day: string; type: string; n: string }>(sql`
      SELECT to_char(date_trunc('day', e.occurred_at AT TIME ZONE ${TIME_ZONE}), 'YYYY-MM-DD') AS day, e.type, count(*) AS n
      FROM usage_events e WHERE ${selected} GROUP BY 1, 2`),
    rows<{ activity_id: string; name: string; views: string; adds: string }>(sql`
      SELECT e.activity_id, a.name,
             count(*) FILTER (WHERE e.type = 'activity_view') AS views,
             count(*) FILTER (WHERE e.type = 'program_add') AS adds
      FROM usage_events e JOIN activities a ON a.id = e.activity_id
      WHERE e.type IN ('activity_view', 'program_add') AND ${selected}
      GROUP BY e.activity_id, a.name`),
    rows<{ text: string; n: string; avg_results: string }>(sql`
      SELECT lower(trim(e.payload->>'text')) AS text, count(*) AS n, avg((e.payload->>'result_count')::numeric) AS avg_results
      FROM usage_events e
      WHERE e.type = 'search' AND trim(coalesce(e.payload->>'text', '')) <> '' AND ${selected}
      GROUP BY 1 ORDER BY n DESC, text LIMIT 15`),
    rows<{ text: string; n: string }>(sql`
      SELECT lower(trim(e.payload->>'text')) AS text, count(*) AS n
      FROM usage_events e
      WHERE e.type = 'search' AND trim(coalesce(e.payload->>'text', '')) <> ''
        AND (e.payload->>'result_count')::int = 0 AND ${selected}
      GROUP BY 1 ORDER BY n DESC, text LIMIT 10`),
    rows<{ division: string; n: string }>(sql`
      SELECT coalesce(d.division, ${NO_DIVISION}) AS division, count(*) AS n
      FROM usage_events e
      LEFT JOIN LATERAL jsonb_array_elements_text(coalesce(e.payload->'divisions', '[]'::jsonb)) AS d(division) ON true
      WHERE e.type = 'search' AND ${selected}
      GROUP BY 1 ORDER BY n DESC`),
    rows<{ user_id: string; name: string | null; searches: string; views: string; adds: string }>(sql`
      SELECT u.id AS user_id, u.name,
             count(*) FILTER (WHERE e.type = 'search') AS searches,
             count(*) FILTER (WHERE e.type = 'activity_view') AS views,
             count(*) FILTER (WHERE e.type = 'program_add') AS adds
      FROM usage_events e JOIN "user" u ON u.id = e.user_id
      WHERE ${selected}
      GROUP BY u.id, u.name ORDER BY count(*) DESC, u.name LIMIT 10`),
  ]);

  const t = totalsRows[0];
  const byDay = new Map<string, { searches: number; views: number; program_adds: number }>();
  for (const day of daysBetween(from, now)) byDay.set(day, { searches: 0, views: 0, program_adds: 0 });
  for (const row of dailyRows) {
    const bucket = byDay.get(row.day);
    if (!bucket) continue;
    if (row.type === 'search') bucket.searches = Number(row.n);
    else if (row.type === 'activity_view') bucket.views = Number(row.n);
    else if (row.type === 'program_add') bucket.program_adds = Number(row.n);
  }

  const activities: ActivityRow[] = activityRows.map((row) => {
    const views = Number(row.views);
    const adds = Number(row.adds);
    return { activity_id: row.activity_id, name: row.name, views, adds, conversion: views > 0 ? adds / views : null };
  });

  return {
    period,
    division,
    from: fromIso,
    totals: {
      searches: Number(t?.searches ?? 0),
      views: Number(t?.views ?? 0),
      program_adds: Number(t?.adds ?? 0),
      visitors: Number(t?.visitors ?? 0),
      signed_in_users: Number(t?.users ?? 0),
    },
    daily: [...byDay].map(([date, counts]) => ({ date, ...counts })),
    top_viewed: activities
      .filter((a) => a.views > 0)
      .sort((a, b) => b.views - a.views || a.name.localeCompare(b.name))
      .slice(0, 10),
    top_added: activities
      .filter((a) => a.adds > 0)
      .sort((a, b) => b.adds - a.adds || a.name.localeCompare(b.name))
      .slice(0, 10),
    top_searches: textRows.map((r) => ({ text: r.text, count: Number(r.n), avg_results: Math.round(Number(r.avg_results) * 10) / 10 })),
    no_result_searches: noResultRows.map((r) => ({ text: r.text, count: Number(r.n) })),
    searches_by_division: divisionRows.map((r) => ({ division: r.division, count: Number(r.n) })),
    top_users: userRows.map((r) => ({
      user_id: r.user_id,
      name: r.name?.trim() || '',
      searches: Number(r.searches),
      views: Number(r.views),
      program_adds: Number(r.adds),
    })),
  };
}
