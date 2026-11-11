'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/locale/LocaleProvider';
import { ObjectivePill } from '../ObjectivePill';
import {
  applyDivisions,
  applySearch,
  buildTree,
  coveredCount,
  isEmptySelection,
  leafCount,
  nodeState,
  removeNode,
  toggleNode,
  type Area,
  type GoalOption,
  type Node,
  type NodeState,
  type Selection,
} from '@/lib/activities/objective-tree';

interface ObjectiveFilterTreeProps {
  goals: GoalOption[];
  /** Divisions currently selected in the filter (empty: all objectives are listed). */
  ageGroups: string[];
  selection: Selection;
  onChange: (selection: Selection) => void;
  /** Phones: keep only one area open at a time. */
  singleOpen?: boolean;
}

/** A checkbox that can show the partial state. */
function TriCheckbox({ state, label, onClick }: { state: NodeState; label: string; onClick: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === 'partial';
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      aria-checked={state === 'partial' ? 'mixed' : state === 'on'}
      checked={state === 'on'}
      onChange={onClick}
      onClick={(event) => event.stopPropagation()}
      className="h-[18px] w-[18px] shrink-0 rounded border-border"
    />
  );
}

/**
 * Educational objectives as a tree: area, general objective, specific objective. A node is
 * off, on (everything under it) or partial. Searching opens the groups that match.
 */
export function ObjectiveFilterTree({ goals, ageGroups, selection, onChange, singleOpen }: ObjectiveFilterTreeProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const fullTree = useMemo(() => buildTree(goals), [goals]);
  const listed = useMemo(() => applyDivisions(fullTree, ageGroups), [fullTree, ageGroups]);
  const shown = useMemo(() => applySearch(listed, search), [listed, search]);
  const [open, setOpen] = useState<string[]>([]);
  const searching = search.trim().length > 0;

  // Areas that hold a selection start open (and open when they gain one).
  useEffect(() => {
    const withSelection = listed
      .filter((area) => nodeState({ kind: 'area', id: area.id }, listed, selection) !== 'off')
      .map((area) => area.id);
    setOpen((current) => (singleOpen ? [withSelection[0] ?? current[0]].filter(Boolean) as string[] : [...new Set([...current, ...withSelection])]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, listed.length]);

  const toggle = (node: Node) => onChange(toggleNode(node, listed, selection));
  const toggleOpen = (areaId: string, isOpen: boolean) =>
    setOpen((current) =>
      isOpen ? (singleOpen ? [areaId] : [...new Set([...current, areaId])]) : current.filter((id) => id !== areaId)
    );

  const chips = useMemo(() => {
    const out: Array<{ node: Node; label: string; goal?: GoalOption }> = [];
    for (const id of selection.areas) {
      const area = fullTree.find((a) => a.id === id);
      if (area) out.push({ node: { kind: 'area', id }, label: area.name });
    }
    for (const id of selection.generals) {
      const general = fullTree.flatMap((a) => a.generals).find((g) => g.id === id);
      if (general) out.push({ node: { kind: 'general', id }, label: general.code });
    }
    for (const id of selection.goals) {
      const goal = goals.find((g) => g.id === id);
      if (goal) out.push({ node: { kind: 'goal', id }, label: goal.code, goal });
    }
    return out;
  }, [selection, fullTree, goals]);

  return (
    <div className="space-y-3" data-testid="objective-tree">
      <Input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('filters.objectivesSearch')}
        aria-label={t('filters.objectivesSearch')}
        className="min-h-11"
      />
      {!isEmptySelection(selection) && (
        <ul className="flex flex-wrap gap-2" aria-label={t('filters.objectivesChips')}>
          {chips.map(({ node, label, goal }) => (
            <li key={`${node.kind}-${node.id}`}>
              <span className="inline-flex items-center gap-1 rounded-lg border bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground">
                {goal ? <ObjectivePill objective={goal} activityAgeGroups={ageGroups.length ? ageGroups : undefined} /> : label}
                <button
                  type="button"
                  aria-label={t('filters.removeFilter', { value: label })}
                  onClick={() => onChange(removeNode(node, selection))}
                  className="rounded p-0.5 hover:text-destructive"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {shown.length === 0 && <p className="text-sm text-muted-foreground">{t('filters.objectivesEmpty')}</p>}
      <div className="rounded-lg border">
        {shown.map((area: Area) => {
          const areaNode: Node = { kind: 'area', id: area.id };
          const isOpen = searching || open.includes(area.id);
          const covered = coveredCount(areaNode, listed, selection);
          return (
            <details
              key={area.id}
              open={isOpen}
              onToggle={(event) => {
                if (!searching) toggleOpen(area.id, (event.currentTarget as HTMLDetailsElement).open);
              }}
              className="border-b last:border-b-0"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 font-bold">
                <ChevronRight aria-hidden className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                <TriCheckbox state={nodeState(areaNode, listed, selection)} label={area.name} onClick={() => toggle(areaNode)} />
                <span>{area.name}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {t('filters.objectivesAvailable', { count: leafCount(areaNode, listed) })}
                  {covered > 0 ? ` · ${t('filters.objectivesSelected', { count: covered })}` : ''}
                </span>
              </summary>
              <div className="space-y-1 pb-2 pl-9 pr-3">
                {area.generals.map((general) => {
                  const generalNode: Node | null = general.id ? { kind: 'general', id: general.id } : null;
                  return (
                    <div key={general.id ?? 'none'}>
                      {generalNode && (
                        <label className="flex min-h-8 items-start gap-2 text-sm font-bold">
                          <TriCheckbox
                            state={nodeState(generalNode, listed, selection)}
                            label={`${general.code} ${general.title}`}
                            onClick={() => toggle(generalNode)}
                          />
                          <span>
                            {general.code} {general.title}
                          </span>
                        </label>
                      )}
                      <ul className="pl-7">
                        {general.leaves.map((leaf) => {
                          const goal = goals.find((g) => g.id === leaf.id)!;
                          const leafNode: Node = { kind: 'goal', id: leaf.id };
                          return (
                            <li key={leaf.id}>
                              <label className="flex min-h-8 items-start gap-2 text-sm">
                                <TriCheckbox state={nodeState(leafNode, listed, selection)} label={`${leaf.code} ${leaf.title}`} onClick={() => toggle(leafNode)} />
                                <span className="flex flex-wrap items-start gap-1">
                                  <ObjectivePill objective={goal} activityAgeGroups={ageGroups.length ? ageGroups : undefined} />
                                  <span title={leaf.title} className="line-clamp-2">
                                    {leaf.title}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
