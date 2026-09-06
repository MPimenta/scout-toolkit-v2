'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/components/locale/LocaleProvider';

interface AdminStats {
  activities: number;
  pending_activities: number;
  users: number;
  public_programs: number;
  pending_suggestions: number;
}

const EMPTY_STATS: AdminStats = {
  activities: 0,
  pending_activities: 0,
  users: 0,
  public_programs: 0,
  pending_suggestions: 0,
};

export default function AdminPage() {
  const { t } = useLocale();
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/stats')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('stats');
        }
        return response.json() as Promise<AdminStats>;
      })
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError(t('admin.statsError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t('admin.title')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('admin.lead')}
      </p>

      {error ? <p className="text-destructive mb-6">{error}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title={t('admin.activities')} value={stats.activities} />
        <StatCard title={t('admin.pending')} value={stats.pending_activities} />
        <StatCard title={t('admin.users')} value={stats.users} />
        <StatCard title={t('nav.publicPrograms')} value={stats.public_programs} />
        <StatCard title={t('admin.suggestions')} value={stats.pending_suggestions} />
      </div>

      <nav className="flex flex-col sm:flex-row gap-3">
        <Link className="text-primary underline" href="/admin/atividades">
          {t('admin.activities')}
        </Link>
        <Link className="text-primary underline" href="/admin/taxonomias">
          {t('admin.taxonomies')}
        </Link>
        <Link className="text-primary underline" href="/admin/utilizadores">
          {t('admin.users')}
        </Link>
        <Link className="text-primary underline" href="/admin/sugestoes">
          {t('admin.suggestions')}
        </Link>
      </nav>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
