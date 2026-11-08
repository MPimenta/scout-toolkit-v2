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

type OrgoUnit = { iri: string; name: string };

type ProgramForDialog = {
  id: string;
  name: string;
  date?: string | null;
  start_time: string;
  is_public: boolean;
  orgo_event_uuid?: string | null;
  orgo_event_url?: string | null;
};

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

  const [begin, setBegin] = useState(defaults.begin);
  const [end, setEnd] = useState(defaults.end);
  const [location, setLocation] = useState('');
  const [unit, setUnit] = useState('');
  const [capacity, setCapacity] = useState('');
  const [publish, setPublish] = useState(false);
  const [units, setUnits] = useState<OrgoUnit[]>([]);
  const [unitsError, setUnitsError] = useState<string | null>(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    url: string;
    warning?: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setBegin(defaults.begin);
    setEnd(defaults.end);
    setLocation('');
    setUnit('');
    setCapacity('');
    setPublish(false);
    setUnitsError(null);
    setLoadingUnits(true);
    fetch(`/api/programs/${program.id}/orgo`)
      .then(async (response) => {
        if (response.status === 503) {
          setUnits([]);
          setUnitsError(t('orgo.unavailable'));
          return;
        }
        if (!response.ok) {
          setUnits([]);
          setUnitsError(t('orgo.loadError'));
          return;
        }
        const body = (await response.json()) as { units?: OrgoUnit[] };
        const list = body.units ?? [];
        setUnits(list);
        if (list.length === 0) {
          setUnitsError(t('orgo.noUnits'));
        }
        if (list.length === 1 && list[0]) {
          setUnit(list[0].iri);
        }
      })
      .catch(() => {
        setUnits([]);
        setUnitsError(t('orgo.loadError'));
      })
      .finally(() => setLoadingUnits(false));
  }, [open, program.id, defaults.begin, defaults.end]);

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
          publish,
          timezone,
        }),
      });
      const body = (await response.json()) as {
        error?: { message?: string };
        orgo_event_url?: string;
        warning?: string;
      };
      if (!response.ok) {
        toast.error(body.error?.message || t('orgo.createError'));
        return;
      }
      // Stay open on a success view with the link; the page refreshes when it closes.
      setCreated({
        url: body.orgo_event_url ?? '',
        ...(body.warning ? { warning: body.warning } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && created) onCreated?.();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('orgo.successTitle')}</DialogTitle>
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

            <div className="space-y-4">
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
                <p
                  id="orgo-begin-text"
                  className="mt-1 text-sm text-muted-foreground"
                >
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
                <p
                  id="orgo-end-text"
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {formatOrgoDateTime(end)}
                </p>
              </div>
              <div>
                <Label htmlFor="orgo-location">{t('orgo.location')}</Label>
                <Input
                  id="orgo-location"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="orgo-unit">{t('orgo.unit')}</Label>
                <Select
                  value={unit}
                  onValueChange={setUnit}
                  disabled={loadingUnits || units.length === 0}
                >
                  <SelectTrigger id="orgo-unit" aria-label={t('orgo.unit')}>
                    <SelectValue
                      placeholder={
                        loadingUnits
                          ? t('orgo.loadingUnits')
                          : t('orgo.chooseUnit')
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((option) => (
                      <SelectItem key={option.iri} value={option.iri}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {unitsError ? (
                  <p className="mt-1 text-sm text-destructive">{unitsError}</p>
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
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="orgo-publish">{t('orgo.publish')}</Label>
                <Switch
                  id="orgo-publish"
                  checked={publish}
                  onCheckedChange={setPublish}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? t('orgo.creating') : t('orgo.createButton')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
