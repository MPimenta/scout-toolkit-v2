'use client';

import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { DivisionToggle } from '@/components/ui/DivisionPill';
import { FactIcon } from '@/components/ui/Fact';
import { useLocale } from '@/components/locale/LocaleProvider';
import { enumLabel } from '@/lib/locale/labels';
import { AGE_GROUP_VALUES, GROUP_SIZE_VALUES, LOCATION_VALUES } from '@/lib/activities/category-values';
import type { FilterState } from '@/lib/activities/filters';
import { buildTree, dropInapplicableGoals, type GoalOption } from '@/lib/activities/objective-tree';
import { DurationRange } from './DurationRange';
import { ObjectiveFilterTree } from './ObjectiveFilterTree';

const EFFORT_VALUES = ['low', 'medium', 'high'] as const;

export interface TypeOption {
  id: string;
  name: string;
  /** Present once activity types are split into format and focus. */
  kind?: 'format' | 'focus' | null;
  activity_count?: number;
}
export interface SdgOption {
  id: string;
  name: string;
  number: number;
  icon_url?: string;
}

interface Props {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  types: TypeOption[];
  sdgs: SdgOption[];
  goals: GoalOption[];
  /** Phones: one column, one open area at a time. */
  compact?: boolean;
}

function Section({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Checks({
  options,
  selected,
  onToggle,
}: {
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      {options.map((option) => (
        <label key={option.value} className="flex min-h-8 items-center gap-2">
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={(e) => onToggle(option.value, e.target.checked)}
            className="h-[18px] w-[18px] rounded border-border"
          />
          <span className="text-sm">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

/** The full filter panel: divisions, facts, duration, types, objectives and SDGs. */
export function FilterPanel({ filters, onChange, types, sdgs, goals, compact }: Props) {
  const { t } = useLocale();
  const toggle = (key: 'groupSize' | 'effortLevel' | 'location' | 'activityType' | 'sdgs') => (value: string, checked: boolean) =>
    onChange({ ...filters, [key]: checked ? [...filters[key], value] : filters[key].filter((v) => v !== value) });

  const toggleDivision = (value: string) => {
    const ageGroup = filters.ageGroup.includes(value)
      ? filters.ageGroup.filter((v) => v !== value)
      : [...filters.ageGroup, value];
    const kept = dropInapplicableGoals(
      { areas: filters.educationalAreas, generals: filters.generalObjectives, goals: filters.educationalGoals },
      buildTree(goals),
      ageGroup
    );
    onChange({ ...filters, ageGroup, educationalGoals: kept.goals });
  };

  const options = (kind: 'groupSize' | 'effort' | 'location', values: readonly string[]) =>
    values.map((value) => ({ value, label: enumLabel(t, kind, value) }));

  // Types: grouped by format and focus once the data carries it; flat otherwise. Empty ones are hidden.
  const visibleTypes = types.filter((type) => type.activity_count === undefined || type.activity_count > 0);
  const grouped = visibleTypes.some((type) => type.kind);
  const typeGroups: Array<{ title: string | null; items: TypeOption[] }> = grouped
    ? [
        { title: t('filters.typeFormat'), items: visibleTypes.filter((x) => x.kind === 'format') },
        { title: t('filters.typeFocus'), items: visibleTypes.filter((x) => x.kind === 'focus') },
        { title: t('filters.typeOther'), items: visibleTypes.filter((x) => !x.kind) },
      ].filter((group) => group.items.length > 0)
    : [{ title: null, items: visibleTypes }];

  return (
    <div className={compact ? 'space-y-6' : 'space-y-6 pt-4'}>
      <Section title={t('filters.age')}>
        <p className="text-xs text-muted-foreground">{t('filters.divisionHint')}</p>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUP_VALUES.map((value) => (
            <DivisionToggle
              key={value}
              ageGroup={value}
              label={enumLabel(t, 'ageGroup', value)}
              selected={filters.ageGroup.includes(value)}
              onToggle={() => toggleDivision(value)}
            />
          ))}
        </div>
      </Section>

      <div className={compact ? 'space-y-6' : 'grid gap-6 md:grid-cols-3'}>
        <Section title={t('filters.groupSize')} icon={<FactIcon kind="groupSize" />}>
          <Checks options={options('groupSize', GROUP_SIZE_VALUES)} selected={filters.groupSize} onToggle={toggle('groupSize')} />
        </Section>
        <Section title={t('filters.effort')} icon={<FactIcon kind="effort" />}>
          <Checks options={options('effort', EFFORT_VALUES)} selected={filters.effortLevel} onToggle={toggle('effortLevel')} />
        </Section>
        <Section title={t('filters.location')} icon={<FactIcon kind="location" />}>
          <Checks options={options('location', LOCATION_VALUES)} selected={filters.location} onToggle={toggle('location')} />
        </Section>
      </div>

      <Section title={t('filters.duration')} icon={<FactIcon kind="duration" />}>
        <DurationRange
          min={filters.durationMin}
          max={filters.durationMax}
          onChange={(bounds) => onChange({ ...filters, durationMin: bounds.min, durationMax: bounds.max })}
        />
      </Section>

      <Section title={t('filters.activityType')}>
        {typeGroups.map((group) => (
          <div key={group.title ?? 'all'} className="space-y-1">
            {group.title && <p className="text-xs font-bold text-muted-foreground">{group.title}</p>}
            <Checks
              options={group.items.map((item) => ({
                value: item.id,
                label: item.activity_count !== undefined ? `${item.name} (${item.activity_count})` : item.name,
              }))}
              selected={filters.activityType}
              onToggle={toggle('activityType')}
            />
          </div>
        ))}
      </Section>

      <Section title={t('filters.objectives')}>
        <ObjectiveFilterTree
          goals={goals}
          ageGroups={filters.ageGroup}
          selection={{ areas: filters.educationalAreas, generals: filters.generalObjectives, goals: filters.educationalGoals }}
          onChange={(sel) =>
            onChange({ ...filters, educationalAreas: sel.areas, generalObjectives: sel.generals, educationalGoals: sel.goals })
          }
          singleOpen={compact}
        />
      </Section>

      <Section title={t('activities.sdgs')} icon={<Globe className="h-4 w-4" aria-hidden />}>
        <div className={compact ? 'grid gap-1' : 'grid max-h-64 gap-1 overflow-y-auto md:grid-cols-2 lg:grid-cols-3'}>
          {sdgs.map((sdg) => (
            <label key={sdg.id} className="flex min-h-8 items-center gap-2">
              <input
                type="checkbox"
                checked={filters.sdgs.includes(sdg.id)}
                onChange={(e) => toggle('sdgs')(sdg.id, e.target.checked)}
                className="h-[18px] w-[18px] rounded border-border"
              />
              {sdg.icon_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sdg.icon_url}
                  alt={t('activities.sdgPrefix', { number: sdg.number })}
                  title={t('activities.sdgTitle', { number: sdg.number, name: sdg.name })}
                  className="h-6 w-6 object-contain"
                />
              )}
              <span className="text-sm">
                <strong>{t('activities.sdgPrefix', { number: sdg.number })}:</strong> {sdg.name}
              </span>
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}
