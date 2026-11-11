'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { defaultBeginDateTime, defaultEndDateTime } from '@/lib/orgo/map-event';
import { useLocale } from '@/components/locale/LocaleProvider';
import type { OrgoCreateResult, OrgoOptions } from '@/types/orgo-options';
import type { OrgoStepName, OrgoSteps } from '@/types/orgo-steps';
import { OrgoParticipantsPicker } from './OrgoParticipantsPicker';
import { OrgoStepsResult } from './OrgoStepsResult';

type ProgramForDialog = {
  id: string;
  name: string;
  date?: string | null;
  start_time: string;
  is_public: boolean;
  orgo_event_uuid?: string | null;
  orgo_event_url?: string | null;
};

type Tab = 'event' | 'participants' | 'description';

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';
  return value.length === 19 ? value.slice(0, 16) : value;
}

/** "2026-11-14T09:30" -> "sábado, 14/11/2026, 09:30" (always pt-PT, whatever the browser language). */
export function formatOrgoDateTime(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return '';
  const [, y, mo, d, h, mi] = match;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi)
  );
  return date.toLocaleString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fromDateTimeLocal(value: string): string {
  return value.length === 16 ? `${value}:00` : value;
}

/** True when some step failed or was skipped, so the owner should see the step list. */
function hasProblems(steps: OrgoSteps): boolean {
  return Object.values(steps).some((step) => step && step.status !== 'done');
}

export function CreateOrgoEventDialog({
  open,
  onOpenChange,
  program,
  entries,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: ProgramForDialog;
  entries: Array<{
    end_time: string;
    custom_title?: string | null;
    activity?: { name?: string } | null;
  }>;
  onCreated?: () => void;
}) {
  const { t } = useLocale();
  const defaults = useMemo(() => {
    const mapped = {
      name: program.name,
      date: program.date ?? null,
      start_time: program.start_time,
      is_public: program.is_public,
      entries,
    };
    return {
      begin: toDateTimeLocal(defaultBeginDateTime(mapped)),
      end: toDateTimeLocal(defaultEndDateTime(mapped)),
    };
  }, [program, entries]);

  const [tab, setTab] = useState<Tab>('event');
  const [begin, setBegin] = useState(defaults.begin);
  const [end, setEnd] = useState(defaults.end);
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState('');
  const [capacity, setCapacity] = useState('');
  const [publish, setPublish] = useState(false);
  const [attach, setAttach] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<OrgoOptions | null>(null);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    url: string;
    attendanceUrl: string;
    steps: OrgoSteps;
    warning?: string;
  } | null>(null);
  const [retrying, setRetrying] = useState<OrgoStepName | null>(null);

  const units = options?.units ?? [];
  const unitName = units.find((option) => option.iri === unit)?.name ?? options?.groupName ?? '';

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setTab('event');
    setBegin(defaults.begin);
    setEnd(defaults.end);
    setLocation('');
    setUnit('');
    setCapacity('');
    setPublish(false);
    setSelected(new Set());
    setOptions(null);
    setUnitsError(null);
    setLoadingUnits(true);
    fetch(`/api/programs/${program.id}/orgo/options`)
      .then(async (response) => {
        if (response.status === 503) {
          setUnitsError(t('orgo.unavailable'));
          return;
        }
        if (!response.ok) {
          setUnitsError(t('orgo.loadError'));
          return;
        }
        const body = (await response.json()) as { data?: OrgoOptions };
        const loaded = body.data;
        if (!loaded) {
          setUnitsError(t('orgo.loadError'));
          return;
        }
        setOptions(loaded);
        setAttach(loaded.attachment.allowed);
        if (loaded.units.length === 0) {
          setUnitsError(t('orgo.noUnits'));
        }
        if (loaded.units.length === 1 && loaded.units[0]) {
          setUnit(loaded.units[0].iri);
        }
      })
      .catch(() => {
        setUnitsError(t('orgo.loadError'));
      })
      .finally(() => setLoadingUnits(false));
  }, [open, program.id, defaults.begin, defaults.end]);

  const canPublish = options?.canPublish ?? false;
  const willPublish = canPublish && publish;
  const inviteCount = willPublish ? selected.size : 0;
  const canSubmit = Boolean(begin && end && unit && !unitsError && !submitting);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(`/api/programs/${program.id}/orgo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateTimeBegin: fromDateTimeLocal(begin),
          dateTimeEnd: fromDateTimeLocal(end),
          location,
          unit,
          maxCapacity: capacity ? Number(capacity) : null,
          publish: willPublish,
          timezone,
          participants: willPublish ? [...selected] : [],
          attachment: Boolean(options?.attachment.allowed && attach),
        }),
      });
      const body = (await response.json()) as Partial<OrgoCreateResult> & {
        error?: { message?: string };
      };
      if (!response.ok) {
        toast.error(body.error?.message || t('orgo.createError'));
        return;
      }
      // Stay open on a result view; the page refreshes when it closes.
      setCreated({
        url: body.orgo_event_url ?? '',
        attendanceUrl: body.orgo_event_attendance_url ?? '',
        steps: body.steps ?? {},
        ...(body.warning ? { warning: body.warning } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (step: OrgoStepName) => {
    setRetrying(step);
    try {
      const response = await fetch(`/api/programs/${program.id}/orgo/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, participants: step === 'invitations' ? [...selected] : [] }),
      });
      const body = (await response.json()) as { steps?: OrgoSteps; error?: { message?: string } };
      if (!response.ok || !body.steps) {
        toast.error(body.error?.message || t('orgo.retryError'));
        return;
      }
      const steps = body.steps;
      setCreated((current) => (current ? { ...current, steps } : current));
    } finally {
      setRetrying(null);
    }
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'event', label: t('orgo.tabEvent') },
    { id: 'participants', label: t('orgo.tabParticipants') },
    { id: 'description', label: t('orgo.tabDescription') },
  ];

  const footerHint = willPublish
    ? inviteCount > 0
      ? t('orgo.footerPublishInvite', { count: inviteCount })
      : t('orgo.footerPublish')
    : t('orgo.footerDraft');

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && created) onCreated?.();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {hasProblems(created.steps) ? t('orgo.resultTitle') : t('orgo.successTitle')}
              </DialogTitle>
              <DialogDescription>{t('orgo.successLead')}</DialogDescription>
            </DialogHeader>
            {created.warning ? (
              <p
                role="alert"
                className="rounded-md border border-accent bg-teal-tint p-3 text-sm text-foreground"
              >
                {created.warning}
              </p>
            ) : null}
            <OrgoStepsResult steps={created.steps} retrying={retrying} onRetry={handleRetry} />
            {hasProblems(created.steps) ? (
              <p className="rounded-md border-l-4 border-accent bg-teal-tint p-3 text-sm">{t('orgo.retryNote')}</p>
            ) : null}
            <p className="text-sm text-muted-foreground">{t('orgo.attendanceNote')}</p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onCreated?.();
                  onOpenChange(false);
                }}
              >
                {t('common.close')}
              </Button>
              {created.attendanceUrl ? (
                <Button asChild variant="outline">
                  <a href={created.attendanceUrl} target="_blank" rel="noopener noreferrer">
                    {t('orgo.openAttendance')}
                  </a>
                </Button>
              ) : null}
              {created.url ? (
                <Button asChild>
                  <a href={created.url} target="_blank" rel="noopener noreferrer">
                    {t('orgo.openEvent')}
                  </a>
                </Button>
              ) : null}
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('orgo.title')}</DialogTitle>
              <DialogDescription>{t('orgo.lead')}</DialogDescription>
            </DialogHeader>

            <div role="tablist" aria-label={t('orgo.title')} className="flex gap-1 overflow-x-auto border-b">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  id={`orgo-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  aria-controls={`orgo-panel-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={`min-h-11 whitespace-nowrap border-b-4 px-3 font-bold ${
                    tab === item.id
                      ? 'border-accent text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {item.id === 'participants' && inviteCount > 0 ? (
                    <span className="ml-2 rounded bg-secondary px-1.5 text-xs text-secondary-foreground">
                      {inviteCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {tab === 'event' ? (
              <div id="orgo-panel-event" role="tabpanel" aria-labelledby="orgo-tab-event" className="space-y-4">
                <div>
                  <Label htmlFor="orgo-name">{t('orgo.name')}</Label>
                  <Input id="orgo-name" value={program.name} readOnly />
                </div>
                <div>
                  <Label htmlFor="orgo-begin">{t('orgo.start')}</Label>
                  <Input
                    id="orgo-begin"
                    type="datetime-local"
                    value={begin}
                    onChange={(event) => setBegin(event.target.value)}
                    required
                    lang="pt-PT"
                    aria-describedby="orgo-begin-text"
                  />
                  <p id="orgo-begin-text" className="mt-1 text-sm text-muted-foreground">
                    {formatOrgoDateTime(begin)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="orgo-end">{t('orgo.end')}</Label>
                  <Input
                    id="orgo-end"
                    type="datetime-local"
                    value={end}
                    onChange={(event) => setEnd(event.target.value)}
                    required
                    lang="pt-PT"
                    aria-describedby="orgo-end-text"
                  />
                  <p id="orgo-end-text" className="mt-1 text-sm text-muted-foreground">
                    {formatOrgoDateTime(end)}
                  </p>
                </div>
                <div>
                  <Label htmlFor="orgo-location">{t('orgo.location')}</Label>
                  <Input id="orgo-location" value={location} onChange={(event) => setLocation(event.target.value)} />
                </div>
                <div>
                  <Label htmlFor="orgo-unit">{t('orgo.unit')}</Label>
                  <Select value={unit} onValueChange={setUnit} disabled={loadingUnits || units.length === 0}>
                    <SelectTrigger id="orgo-unit" aria-label={t('orgo.unit')}>
                      <SelectValue placeholder={loadingUnits ? t('orgo.loadingUnits') : t('orgo.chooseUnit')} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((option) => (
                        <SelectItem key={option.iri} value={option.iri}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {unitsError ? <p className="mt-1 text-sm text-destructive">{unitsError}</p> : null}
                  {unit ? (
                    <p className="mt-1 text-sm text-muted-foreground">{t('orgo.whoSees', { unit: unitName })}</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="orgo-capacity">{t('orgo.capacity')}</Label>
                  <Input
                    id="orgo-capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(event) => setCapacity(event.target.value)}
                  />
                </div>
                {canPublish ? (
                  <div className="rounded-md border-l-4 border-accent bg-teal-tint p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="orgo-publish">{t('orgo.publish')}</Label>
                      <Switch id="orgo-publish" checked={publish} onCheckedChange={setPublish} />
                    </div>
                    <p className="mt-2 text-sm">
                      {publish ? t('orgo.publishWarning', { unit: unitName }) : t('orgo.publishOff')}
                    </p>
                  </div>
                ) : options ? (
                  <p className="rounded-md border-l-4 border-accent bg-teal-tint p-3 text-sm">
                    {t('orgo.noPublishRight')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {tab === 'participants' ? (
              <div id="orgo-panel-participants" role="tabpanel" aria-labelledby="orgo-tab-participants">
                {!options?.participants ? (
                  <p className="rounded-md border-l-4 border-destructive p-3 text-sm">
                    {options ? t('orgo.participantsUnavailable') : t('orgo.loadingUnits')}
                  </p>
                ) : !canPublish ? (
                  <p className="rounded-md border-l-4 border-destructive p-3 text-sm">{t('orgo.participantsNoRight')}</p>
                ) : !publish ? (
                  <p className="rounded-md border-l-4 border-accent bg-teal-tint p-3 text-sm">
                    {t('orgo.participantsNeedPublish')}
                  </p>
                ) : (
                  <OrgoParticipantsPicker tree={options.participants} selected={selected} onChange={setSelected} />
                )}
              </div>
            ) : null}

            {tab === 'description' ? (
              <div id="orgo-panel-description" role="tabpanel" aria-labelledby="orgo-tab-description" className="space-y-4">
                <div>
                  <h3 className="font-bold">{t('orgo.descriptionTitle')}</h3>
                  <p className="text-sm">
                    {options && options.descriptionSummary.challenges > 0
                      ? t('orgo.descriptionSummary', {
                          blocks: options.descriptionSummary.blocks,
                          challenges: options.descriptionSummary.challenges,
                        })
                      : t('orgo.descriptionSummaryNone', { blocks: options?.descriptionSummary.blocks ?? 0 })}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold">{t('orgo.attachmentTitle')}</h3>
                  {options?.attachment.allowed ? (
                    <>
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-md border p-3">
                        <Label htmlFor="orgo-attach">
                          {t('orgo.attachmentLabel', { file: options.attachment.fileName })}
                        </Label>
                        <Switch id="orgo-attach" checked={attach} onCheckedChange={setAttach} />
                      </div>
                      <p className="mt-2 rounded-md border-l-4 border-accent bg-teal-tint p-3 text-sm">
                        {t('orgo.attachmentPublicNote')}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 rounded-md border-l-4 border-accent bg-teal-tint p-3 text-sm">
                      {t('orgo.attachmentPrivate')}
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            <DialogFooter className="items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">{footerHint}</span>
              <span className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                  {submitting ? t('orgo.creating') : t('orgo.createButton')}
                </Button>
              </span>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
