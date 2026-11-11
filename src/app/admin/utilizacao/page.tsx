'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';
import { AGE_GROUP_VALUES } from '@/lib/activities/category-values';
import { NO_DIVISION, USAGE_PERIODS, type UsagePeriod, type UsageSummary } from '@/lib/usage/analytics-shared';

function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded bg-muted" aria-hidden>
      <div className="h-2 rounded bg-primary" style={{ width: `${value > 0 ? width : 0}%` }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function UsagePage() {
  const { t } = useLocale();
  const [period, setPeriod] = useState<UsagePeriod>('30d');
  const [division, setDivision] = useState<string | null>(null);
  const [data, setData] = useState<UsageSummary | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    const query = new URLSearchParams({ period, ...(division ? { division } : {}) });
    fetch(`/api/admin/usage/summary?${query}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('usage');
        return (await response.json()) as UsageSummary;
      })
      .then((summary) => {
        if (cancelled) return;
        setData(summary);
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [period, division]);

  const divisionLabel = (value: string) =>
    value === NO_DIVISION ? t('usageAnalytics.noDivision') : enumLabel(t, 'ageGroup', value);
  const percent = (value: number | null) => (value === null ? '—' : `${Math.round(value * 100)}%`);
  const hasEvents = data ? data.totals.searches + data.totals.views + data.totals.program_adds > 0 : false;
  const maxDaily = data ? Math.max(1, ...data.daily.map((d) => d.searches + d.views + d.program_adds)) : 1;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-primary underline">
        {t('usageAnalytics.back')}
      </Link>
      <h1 className="mb-2 mt-2 text-3xl font-bold">{t('usageAnalytics.title')}</h1>
      <p className="mb-6 text-muted-foreground">{t('usageAnalytics.lead')}</p>

      <div className="mb-6 space-y-3">
        <div role="group" aria-label={t('usageAnalytics.period')} className="flex flex-wrap gap-2">
          {USAGE_PERIODS.map((value) => (
            <Button
              key={value}
              variant={period === value ? 'default' : 'outline'}
              className="min-h-11"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
            >
              {t(`usageAnalytics.period_${value}`)}
            </Button>
          ))}
        </div>
        <div role="group" aria-label={t('usageAnalytics.division')} className="flex flex-wrap gap-2">
          <Button
            variant={division === null ? 'default' : 'outline'}
            className="min-h-11"
            aria-pressed={division === null}
            onClick={() => setDivision(null)}
          >
            {t('usageAnalytics.allDivisions')}
          </Button>
          {AGE_GROUP_VALUES.map((value) => (
            <Button
              key={value}
              variant={division === value ? 'default' : 'outline'}
              className="min-h-11"
              aria-pressed={division === value}
              onClick={() => setDivision(value)}
            >
              {enumLabel(t, 'ageGroup', value)}
            </Button>
          ))}
        </div>
      </div>

      {state === 'loading' && <p role="status">{t('usageAnalytics.loading')}</p>}
      {state === 'error' && (
        <p role="alert" className="text-destructive">
          {t('usageAnalytics.error')}
        </p>
      )}

      {state === 'ready' && data && (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">{t('usageAnalytics.indicative')}</p>
          {!hasEvents && <p>{t('usageAnalytics.empty')}</p>}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Stat label={t('usageAnalytics.searches')} value={data.totals.searches} />
            <Stat label={t('usageAnalytics.views')} value={data.totals.views} />
            <Stat label={t('usageAnalytics.programAdds')} value={data.totals.program_adds} />
            <Stat label={t('usageAnalytics.visitors')} value={data.totals.visitors} />
            <Stat label={t('usageAnalytics.users')} value={data.totals.signed_in_users} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('usageAnalytics.evolution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex h-32 items-end gap-px" aria-label={t('usageAnalytics.evolution')}>
                {data.daily.map((day) => {
                  const total = day.searches + day.views + day.program_adds;
                  return (
                    <li
                      key={day.date}
                      className="flex-1 rounded-t bg-primary"
                      style={{ height: `${total > 0 ? Math.max(3, (total / maxDaily) * 100) : 0}%` }}
                      title={t('usageAnalytics.dayTitle', {
                        date: day.date,
                        searches: day.searches,
                        views: day.views,
                        adds: day.program_adds,
                      })}
                    />
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <ActivityTable
              title={t('usageAnalytics.topViewed')}
              rows={data.top_viewed}
              head={[t('usageAnalytics.activity'), t('usageAnalytics.views'), t('usageAnalytics.programAdds'), t('usageAnalytics.conversion')]}
              percent={percent}
              empty={t('usageAnalytics.noRows')}
            />
            <ActivityTable
              title={t('usageAnalytics.topAdded')}
              rows={data.top_added}
              head={[t('usageAnalytics.activity'), t('usageAnalytics.views'), t('usageAnalytics.programAdds'), t('usageAnalytics.conversion')]}
              percent={percent}
              empty={t('usageAnalytics.noRows')}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('usageAnalytics.topSearches')}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.top_searches.length === 0 ? (
                  <p className="text-muted-foreground">{t('usageAnalytics.noRows')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="pb-2">{t('usageAnalytics.text')}</th>
                        <th className="pb-2 text-right">{t('usageAnalytics.times')}</th>
                        <th className="pb-2 text-right">{t('usageAnalytics.avgResults')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_searches.map((row) => (
                        <tr key={row.text} className="border-t">
                          <td className="py-1">{row.text}</td>
                          <td className="py-1 text-right">{row.count}</td>
                          <td className="py-1 text-right">{row.avg_results}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('usageAnalytics.noResults')}</CardTitle>
              </CardHeader>
              <CardContent>
                {data.no_result_searches.length === 0 ? (
                  <p className="text-muted-foreground">{t('usageAnalytics.noRows')}</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {data.no_result_searches.map((row) => (
                        <tr key={row.text} className="border-t first:border-t-0">
                          <td className="py-1">{row.text}</td>
                          <td className="py-1 text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('usageAnalytics.byDivision')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.searches_by_division.length === 0 && <p className="text-muted-foreground">{t('usageAnalytics.noRows')}</p>}
              {data.searches_by_division.map((row) => (
                <div key={row.division} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-3 text-sm">
                  <span>{divisionLabel(row.division)}</span>
                  <Bar value={row.count} max={data.searches_by_division[0]?.count ?? 0} />
                  <span className="text-right">{row.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('usageAnalytics.topUsers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {data.top_users.length === 0 ? (
                <p className="text-muted-foreground">{t('usageAnalytics.noRows')}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-2">{t('usageAnalytics.user')}</th>
                      <th className="pb-2 text-right">{t('usageAnalytics.searches')}</th>
                      <th className="pb-2 text-right">{t('usageAnalytics.views')}</th>
                      <th className="pb-2 text-right">{t('usageAnalytics.programAdds')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_users.map((row) => (
                      <tr key={row.user_id} className="border-t">
                        <td className="py-1">{row.name || t('usageAnalytics.unnamed')}</td>
                        <td className="py-1 text-right">{row.searches}</td>
                        <td className="py-1 text-right">{row.views}</td>
                        <td className="py-1 text-right">{row.program_adds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ActivityTable({
  title,
  rows,
  head,
  percent,
  empty,
}: {
  title: string;
  rows: UsageSummary['top_viewed'];
  head: string[];
  percent: (value: number | null) => string;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground">{empty}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">{head[0]}</th>
                <th className="pb-2 text-right">{head[1]}</th>
                <th className="pb-2 text-right">{head[2]}</th>
                <th className="pb-2 text-right">{head[3]}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.activity_id} className="border-t">
                  <td className="py-1 pr-2">
                    <Link href={`/activities/${row.activity_id}`} className="text-primary underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-1 text-right">{row.views}</td>
                  <td className="py-1 text-right">{row.adds}</td>
                  <td className="py-1 text-right">{percent(row.conversion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
