'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DivisionPill } from '@/components/ui/DivisionPill';
import { FactIcon } from '@/components/ui/Fact';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';
import { durationReadout } from '@/lib/activities/duration';
import type { FilterState } from '@/lib/activities/filters';
import type { GoalOption } from '@/lib/activities/objective-tree';

export interface ChipOptions {
  types: Array<{ id: string; name: string }>;
  sdgs: Array<{ id: string; name: string; number: number }>;
  goals: GoalOption[];
  areas: Array<{ id: string; name: string }>;
  generals: Array<{ id: string; code: string }>;
}

interface Props {
  filters: FilterState;
  options: ChipOptions;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}

function Chip({ children, label, onRemove }: { children: ReactNode; label: string; onRemove: () => void }) {
  const { t } = useLocale();
  return (
    <li className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-sm text-primary">
      {children}
      <button
        type="button"
        aria-label={t('filters.removeFilter', { value: label })}
        onClick={onRemove}
        className="rounded p-0.5 hover:text-destructive"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </li>
  );
}

/** The chosen filters as removable chips; icons and division pills match the panel and the cards. */
export function ActiveFilterChips({ filters, options, onChange, onClear }: Props) {
  const { t } = useLocale();
  const without = (key: keyof FilterState, value: string) =>
    onChange({ ...filters, [key]: (filters[key] as string[]).filter((v) => v !== value) });

  const fact = (kind: 'groupSize' | 'effort' | 'location', key: 'groupSize' | 'effortLevel' | 'location', icon: 'groupSize' | 'effort' | 'location') =>
    filters[key].map((value) => {
      const label = enumLabel(t, kind, value);
      return (
        <Chip key={`${key}-${value}`} label={label} onRemove={() => without(key, value)}>
          <FactIcon kind={icon} />
          {label}
        </Chip>
      );
    });

  const durationText = durationReadout({ min: filters.durationMin, max: filters.durationMax }, t);

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-primary">{t('activities.filtersActiveTitle')}</span>
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs text-primary hover:text-primary/80">
            <X className="mr-1 h-3 w-3" aria-hidden />
            {t('common.clearAll')}
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {filters.search && (
            <Chip label={filters.search} onRemove={() => onChange({ ...filters, search: '' })}>
              {t('filters.badgeSearch', { value: filters.search })}
            </Chip>
          )}
          {filters.ageGroup.map((value) => {
            const label = enumLabel(t, 'ageGroup', value);
            return (
              <Chip key={`age-${value}`} label={label} onRemove={() => without('ageGroup', value)}>
                <DivisionPill ageGroup={value} code={label} labelOnly />
              </Chip>
            );
          })}
          {fact('groupSize', 'groupSize', 'groupSize')}
          {fact('effort', 'effortLevel', 'effort')}
          {fact('location', 'location', 'location')}
          {(filters.durationMin || filters.durationMax) && (
            <Chip label={durationText} onRemove={() => onChange({ ...filters, durationMin: '', durationMax: '' })}>
              <FactIcon kind="duration" />
              {durationText}
            </Chip>
          )}
          {filters.activityType.map((id) => {
            const name = options.types.find((o) => o.id === id)?.name ?? '';
            return (
              <Chip key={`type-${id}`} label={name} onRemove={() => without('activityType', id)}>
                {t('filters.badgeType', { value: name })}
              </Chip>
            );
          })}
          {filters.sdgs.map((id) => {
            const sdg = options.sdgs.find((o) => o.id === id);
            const text = t('activities.sdgTitle', { number: sdg?.number ?? '', name: sdg?.name ?? '' });
            return (
              <Chip key={`sdg-${id}`} label={text} onRemove={() => without('sdgs', id)}>
                {text}
              </Chip>
            );
          })}
          {filters.educationalAreas.map((id) => {
            const name = options.areas.find((a) => a.id === id)?.name ?? '';
            return (
              <Chip key={`area-${id}`} label={name} onRemove={() => without('educationalAreas', id)}>
                {name}
              </Chip>
            );
          })}
          {filters.generalObjectives.map((id) => {
            const code = options.generals.find((g) => g.id === id)?.code ?? '';
            return (
              <Chip key={`gen-${id}`} label={code} onRemove={() => without('generalObjectives', id)}>
                {code}
              </Chip>
            );
          })}
          {filters.educationalGoals.map((id) => {
            const goal = options.goals.find((g) => g.id === id);
            return (
              <Chip key={`goal-${id}`} label={goal?.code ?? ''} onRemove={() => without('educationalGoals', id)}>
                {goal?.code ?? ''}
              </Chip>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
