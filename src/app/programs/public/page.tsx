'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';

interface PublicProgram {
  id: string;
  name: string;
  date: string | null;
  start_time: string;
  author_name: string;
  entry_count: number;
  total_duration_minutes: number;
}

export default function PublicProgramsPage() {
  const { t, locale } = useLocale();
  const [programs, setPrograms] = useState<PublicProgram[]>([]);
  const [search, setSearch] = useState('');
  const [hasDate, setHasDate] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (hasDate) params.set('has_date', hasDate);
    if (duration) params.set('duration', duration);
    setLoading(true);
    fetch(`/api/programs/public?${params}`)
      .then((response) => response.json())
      .then((data) => setPrograms(data.programs ?? []))
      .finally(() => setLoading(false));
  }, [search, hasDate, duration]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t('publicPrograms.title')}</h1>
      <p className="text-muted-foreground mb-6">
        {t('publicPrograms.lead')}
      </p>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <Input
          placeholder={t('publicPrograms.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t('publicPrograms.searchLabel')}
        />
        <select
          className="border rounded-md h-10 px-3"
          value={hasDate}
          onChange={(event) => setHasDate(event.target.value)}
          aria-label={t('publicPrograms.dateLabel')}
        >
          <option value="">{t('publicPrograms.anyDate')}</option>
          <option value="true">{t('publicPrograms.withDate')}</option>
          <option value="false">{t('publicPrograms.withoutDate')}</option>
        </select>
        <select
          className="border rounded-md h-10 px-3"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          aria-label={t('publicPrograms.durationLabel')}
        >
          <option value="">{t('publicPrograms.anyDuration')}</option>
          <option value="short">{t('publicPrograms.short')}</option>
          <option value="medium">{t('publicPrograms.medium')}</option>
          <option value="long">{t('publicPrograms.long')}</option>
        </select>
        <Button variant="outline" onClick={() => { setSearch(''); setHasDate(''); setDuration(''); }}>
          {t('common.clear')}
        </Button>
      </div>

      {loading ? <p>{t('common.loading')}</p> : null}
      {!loading && programs.length === 0 ? (
        <p className="text-muted-foreground">{t('publicPrograms.empty')}</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((program) => (
          <Card key={program.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                <Link href={`/programs/public/${program.id}`} className="hover:underline">
                  {program.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>{t('programs.byAuthor', { name: program.author_name })}</p>
              <p>{program.date ? new Date(program.date).toLocaleDateString(locale === 'en' ? 'en-GB' : 'pt-PT') : t('programs.noDate')}</p>
              <p>{t('programs.entriesDuration', { count: program.entry_count, minutes: program.total_duration_minutes })}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
