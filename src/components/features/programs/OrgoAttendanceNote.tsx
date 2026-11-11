'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/locale/LocaleProvider';

type Counts = { invited: number | null; attending: number | null };

/**
 * Under the links to the eAEP event: how many members were invited and how many answered
 * "attending" (counts), and where attendance is checked. Names stay in eAEP. A failed read just
 * shows the sentence.
 */
export function OrgoAttendanceNote({ programId }: { programId: string }) {
  const { t } = useLocale();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/programs/${programId}/orgo/attendance`)
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as { data?: Partial<Counts> };
        const invited = body.data?.invited;
        const attending = body.data?.attending;
        if (active && typeof invited === 'number') {
          setCounts({ invited, attending: typeof attending === 'number' ? attending : null });
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [programId]);

  const summary = !counts
    ? ''
    : counts.attending !== null
      ? t('orgo.attendanceCounts', { attending: counts.attending, invited: counts.invited ?? 0 })
      : t('orgo.attendanceInvited', { count: counts.invited ?? 0 });

  return (
    <p className="text-sm text-muted-foreground" data-testid="orgo-attendance-note">
      {summary ? `${summary} · ` : ''}
      {t('orgo.attendanceNote')}
    </p>
  );
}
