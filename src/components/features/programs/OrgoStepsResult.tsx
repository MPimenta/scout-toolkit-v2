'use client';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';
import type { OrgoStepBase, OrgoSteps, OrgoStepName } from '@/types/orgo-steps';

function Mark({ status }: { status: OrgoStepBase['status'] }) {
  const style =
    status === 'done'
      ? 'bg-primary text-primary-foreground'
      : status === 'failed'
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-muted text-muted-foreground';
  const symbol = status === 'done' ? '✓' : status === 'failed' ? '!' : '–';
  return (
    <span aria-hidden="true" className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold ${style}`}>
      {symbol}
    </span>
  );
}

/**
 * What happened to each step after the event was created, with a retry for a failed one.
 * Shows counts and short reasons only: never the names of the people invited.
 */
export function OrgoStepsResult({
  steps,
  retrying,
  onRetry,
}: {
  steps: OrgoSteps;
  retrying: OrgoStepName | null;
  onRetry: (step: OrgoStepName) => void;
}) {
  const { t } = useLocale();

  const rows: Array<{ name: OrgoStepName; step: OrgoStepBase; title: string; note: string | null; retryLabel: string }> = [];
  if (steps.publish) {
    rows.push({
      name: 'publish',
      step: steps.publish,
      title: t('orgo.stepPublish'),
      note: steps.publish.status === 'done' ? t('orgo.stepPublishNote') : (steps.publish.reason ?? null),
      retryLabel: t('orgo.retryStep'),
    });
  }
  if (steps.invitations) {
    const { added, requested } = steps.invitations;
    rows.push({
      name: 'invitations',
      step: steps.invitations,
      title: t('orgo.stepInvitations', { added, requested }),
      note: steps.invitations.status === 'done' ? null : (steps.invitations.reason ?? null),
      retryLabel: t('orgo.retryRemaining'),
    });
  }
  if (steps.attachment) {
    rows.push({
      name: 'attachment',
      step: steps.attachment,
      title: t('orgo.stepAttachment'),
      note: steps.attachment.status === 'done' ? t('orgo.stepAttachmentDone') : (steps.attachment.reason ?? null),
      retryLabel: t('orgo.retryStep'),
    });
  }
  if (rows.length === 0) return null;

  return (
    <ul className="divide-y rounded-md border">
      {rows.map((row) => (
        <li key={row.name} className="flex flex-wrap items-center gap-3 p-3">
          <Mark status={row.step.status} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{row.title}</p>
            {row.note ? <p className="text-sm text-muted-foreground">{row.note}</p> : null}
            {row.step.status === 'skipped' ? (
              <p className="text-sm text-muted-foreground">{t('orgo.stepSkipped')}</p>
            ) : null}
          </div>
          {row.step.status === 'failed' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              disabled={retrying !== null}
              onClick={() => onRetry(row.name)}
            >
              {retrying === row.name ? t('orgo.retrying') : row.retryLabel}
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
