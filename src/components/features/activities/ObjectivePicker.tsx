'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/locale/LocaleProvider';
import { ObjectivePill } from './ObjectivePill';

export interface PickerGoal {
  id: string;
  code: string;
  title: string;
  age_groups: string[];
  area: { id: string; name: string } | null;
  general_objective: { id: string; code: string; title: string } | null;
}

/** Goals that belong to at least one of the given age groups. */
export function goalsForAgeGroups(goals: PickerGoal[], ageGroups: readonly string[]): PickerGoal[] {
  return goals.filter((goal) => goal.age_groups.some((group) => ageGroups.includes(group)));
}

/**
 * Drops selected objectives that no longer match the chosen age groups.
 * Returns the kept ids and the codes that were removed (for the user message).
 */
export function reconcileSelection(
  goals: PickerGoal[],
  ageGroups: readonly string[],
  selected: readonly string[]
): { kept: string[]; removedCodes: string[] } {
  const valid = new Set(goalsForAgeGroups(goals, ageGroups).map((goal) => goal.id));
  const kept = selected.filter((id) => valid.has(id));
  const removedCodes = selected
    .filter((id) => !valid.has(id))
    .map((id) => goals.find((goal) => goal.id === id)?.code ?? id);
  return { kept, removedCodes };
}

interface ObjectivePickerProps {
  goals: PickerGoal[];
  ageGroups: string[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** Objectives of the selected age groups, grouped by area and general objective, with search. */
export function ObjectivePicker({ goals, ageGroups, selected, onChange }: ObjectivePickerProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = goalsForAgeGroups(goals, ageGroups).filter(
      (goal) => !needle || goal.code.toLowerCase().includes(needle) || goal.title.toLowerCase().includes(needle)
    );
    const byArea = new Map<string, { name: string; objectives: Map<string, { title: string; goals: PickerGoal[] }> }>();
    for (const goal of visible) {
      const areaKey = goal.area?.id ?? 'none';
      const area = byArea.get(areaKey) ?? { name: goal.area?.name ?? '', objectives: new Map() };
      const objectiveKey = goal.general_objective?.id ?? 'none';
      const objective = area.objectives.get(objectiveKey) ?? {
        title: goal.general_objective ? `${goal.general_objective.code} ${goal.general_objective.title}` : '',
        goals: [],
      };
      objective.goals.push(goal);
      area.objectives.set(objectiveKey, objective);
      byArea.set(areaKey, area);
    }
    return [...byArea.values()];
  }, [goals, ageGroups, query]);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold">{t('activityEditor.objectivesLegend')}</legend>
      {ageGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('activityEditor.objectivesHint')}</p>
      ) : (
        <>
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('activityEditor.objectivesSearch')}
            aria-label={t('activityEditor.objectivesSearch')}
          />
          {selected.length > 0 && (
            <ul className="flex flex-wrap gap-1" aria-label={t('activityEditor.objectivesSelected')}>
              {goals
                .filter((goal) => selected.includes(goal.id))
                .map((goal) => (
                  <li key={goal.id}>
                    <ObjectivePill objective={goal} activityAgeGroups={ageGroups} />
                  </li>
                ))}
            </ul>
          )}
          <div className="max-h-80 space-y-4 overflow-y-auto rounded-lg border p-3">
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('activityEditor.objectivesEmpty')}</p>
            )}
            {groups.map((area) => (
              <div key={area.name} className="space-y-2">
                <h3 className="text-sm font-bold text-primary">{area.name}</h3>
                {[...area.objectives.values()].map((objective) => (
                  <div key={objective.title} className="space-y-1">
                    {objective.title && <p className="text-xs text-muted-foreground">{objective.title}</p>}
                    <ul className="space-y-1">
                      {objective.goals.map((goal) => (
                        <li key={goal.id}>
                          <label className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selected.includes(goal.id)}
                              onChange={() => toggle(goal.id)}
                            />
                            <span>
                              <span className="mr-1 font-bold">{goal.code}</span>
                              {goal.title}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </fieldset>
  );
}
