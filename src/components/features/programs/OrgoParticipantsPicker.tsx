'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DivisionPill } from '@/components/ui/DivisionPill';
import { useLocale } from '@/components/locale/LocaleProvider';
import { normalizeSearchText } from '@/lib/orgo/members';
import type { ParticipantMember, ParticipantTree } from '@/types/orgo-participants';

/** Orgo member type -> the division colour and the plural name shown in the pill. */
const TYPE_PILL: Record<string, { ageGroup: string; label: string }> = {
  Lobito: { ageGroup: 'cub_scouts', label: 'Lobitos' },
  Escoteiro: { ageGroup: 'scouts', label: 'Escoteiros' },
  Explorador: { ageGroup: 'adventurers', label: 'Exploradores' },
  Caminheiro: { ageGroup: 'rovers', label: 'Caminheiros' },
  Dirigente: { ageGroup: 'leaders', label: 'Dirigentes' },
};

function TriCheckbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-5 w-5 shrink-0 accent-primary"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
    />
  );
}

function matches(member: ParticipantMember, query: string): boolean {
  const text = normalizeSearchText(query);
  if (!text) return true;
  if (member.cardId && member.cardId.toLowerCase().includes(text)) return true;
  const name = normalizeSearchText(member.name);
  return text.split(/\s+/).filter(Boolean).every((word) => name.includes(word));
}

/**
 * Chooses the members to invite: the leader's own group, by divisão, with a search by name or
 * card number. Nobody is selected by default. Member data stays in this component's state and
 * is sent only when the event is created.
 */
export function OrgoParticipantsPicker({
  tree,
  selected,
  onChange,
}: {
  tree: ParticipantTree;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');

  const visible = useMemo(
    () =>
      tree.members.filter(
        (member) => (!divisionFilter || member.divisionId === divisionFilter) && matches(member, query)
      ),
    [tree.members, query, divisionFilter]
  );
  const visibleIds = useMemo(() => visible.map((member) => member.id), [visible]);

  const setMany = (ids: string[], on: boolean) => {
    const next = new Set(selected);
    for (const id of ids) {
      if (on) next.add(id);
      else next.delete(id);
    }
    onChange(next);
  };

  const state = (ids: string[]) => {
    const count = ids.filter((id) => selected.has(id)).length;
    return { checked: ids.length > 0 && count === ids.length, indeterminate: count > 0 && count < ids.length, count };
  };

  const group = state(visibleIds);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="orgo-participants-search">{t('orgo.searchLabel')}</Label>
          <Input
            id="orgo-participants-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('orgo.searchPlaceholder')}
          />
        </div>
        <div className="w-full sm:w-56">
          <Label htmlFor="orgo-participants-division">{t('orgo.divisionFilter')}</Label>
          <select
            id="orgo-participants-division"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={divisionFilter}
            onChange={(event) => setDivisionFilter(event.target.value)}
          >
            <option value="">{t('orgo.allDivisions')}</option>
            {tree.divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.id === 'none' ? t('orgo.otherMembers') : division.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p className="mr-2 font-bold" role="status">
          {t('orgo.inviting', { count: selected.size, total: tree.total })}
        </p>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setMany(visibleIds, true)} disabled={visible.length === 0}>
          {t('orgo.inviteAll')}
        </Button>
        <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => onChange(new Set())} disabled={selected.size === 0}>
          {t('orgo.clearSelection')}
        </Button>
      </div>

      <div className="max-h-[22rem] overflow-auto rounded-md border" data-testid="orgo-participants-tree">
        {visible.length === 0 ? (
          <p className="p-4 text-muted-foreground">{t('orgo.noMatches')}</p>
        ) : (
          <div>
            <div className="flex min-h-11 items-center gap-3 bg-secondary px-3 font-bold">
              <TriCheckbox
                checked={group.checked}
                indeterminate={group.indeterminate}
                onChange={(on) => setMany(visibleIds, on)}
                label={t('orgo.selectGroup', { name: tree.groupName ?? '' })}
              />
              <span className="flex-1">{tree.groupName}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {group.count} / {visibleIds.length}
              </span>
            </div>
            {tree.divisions.map((division) => {
              const members = visible.filter((member) => member.divisionId === division.id);
              if (members.length === 0) return null;
              const ids = members.map((member) => member.id);
              const divisionState = state(ids);
              const pill = division.userType ? TYPE_PILL[division.userType] : undefined;
              const title = division.id === 'none' ? t('orgo.otherMembers') : division.name;
              return (
                <section key={division.id} aria-label={title}>
                  <div className="flex min-h-11 items-center gap-3 border-t bg-muted px-3 pl-8">
                    <TriCheckbox
                      checked={divisionState.checked}
                      indeterminate={divisionState.indeterminate}
                      onChange={(on) => setMany(ids, on)}
                      label={t('orgo.selectDivision', { name: title })}
                    />
                    {pill ? <DivisionPill ageGroup={pill.ageGroup} code={pill.label} labelOnly /> : null}
                    <span className="flex-1 font-bold">{title}</span>
                    <span className="text-sm text-muted-foreground">
                      {divisionState.count} / {ids.length}
                    </span>
                  </div>
                  <ul>
                    {members.map((member) => (
                      <li key={member.id} className="flex min-h-11 items-center gap-3 border-t px-3 pl-14">
                        <TriCheckbox
                          checked={selected.has(member.id)}
                          indeterminate={false}
                          onChange={(on) => setMany([member.id], on)}
                          label={t('orgo.inviteMember', { name: member.name })}
                        />
                        <span className="flex-1">{member.name}</span>
                        {member.cardId ? (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {t('orgo.cardNumber', { card: member.cardId })}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
      <p className="rounded-md border-l-4 border-accent bg-teal-tint p-3 text-sm">
        {t('orgo.scopeNote')} {t('orgo.noEmailNote')}
      </p>
    </div>
  );
}
