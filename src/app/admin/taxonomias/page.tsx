'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AGE_GROUP_VALUES } from '../../../../drizzle/schema/category-values';
import { DIVISIONS } from '@/lib/design/tokens';

interface GeneralObjectiveOption {
  id: string;
  code: string;
  title: string;
  area_id: string;
}

const TABS = [
  { id: 'educational-areas', label: 'Áreas', list: '/api/taxonomies/educational-areas', key: 'educational_areas' },
  { id: 'educational-goals', label: 'Objetivos', list: '/api/taxonomies/educational-goals', key: 'educational_goals' },
  { id: 'sdgs', label: 'ODS', list: '/api/taxonomies/sdgs', key: 'sdgs' },
] as const;

export default function AdminTaxonomiesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('educational-areas');
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [generalObjectives, setGeneralObjectives] = useState<GeneralObjectiveOption[]>([]);
  const current = TABS.find((item) => item.id === tab)!;

  const load = () => {
    fetch(current.list)
      .then((response) => response.json())
      .then((data) => setItems(data[current.key] ?? []));
  };

  useEffect(() => {
    load();
  }, [tab]);

  // General objectives (with their area) feed the goal form.
  useEffect(() => {
    fetch('/api/taxonomies/educational-areas')
      .then((response) => response.json())
      .then((data: { educational_areas?: Array<{ id: string; general_objectives: Array<{ id: string; code: string; title: string }> }> }) =>
        setGeneralObjectives(
          (data.educational_areas ?? []).flatMap((area) =>
            area.general_objectives.map((objective) => ({ ...objective, area_id: area.id }))
          )
        )
      );
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Taxonomias</h1>
      <div className="flex gap-2 mb-6">
        {TABS.map((item) => (
          <Button key={item.id} variant={tab === item.id ? 'default' : 'outline'} onClick={() => setTab(item.id)}>
            {item.label}
          </Button>
        ))}
      </div>
      <form
        className="flex flex-col md:flex-row gap-2 mb-6"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const payload: Record<string, unknown> = Object.fromEntries(form.entries());
          if (tab === 'educational-goals') {
            const general = generalObjectives.find((item) => item.id === payload.general_objective_id);
            payload.area_id = general?.area_id;
            payload.age_groups = form.getAll('age_groups');
            delete payload.name;
          }
          await fetch(`/api/admin/taxonomies/${tab}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          load();
        }}
      >
        {tab !== 'educational-goals' ? <Input name="name" placeholder="Nome" required /> : null}
        {tab === 'educational-goals' ? <Input name="title" placeholder="Título" required /> : null}
        {tab === 'educational-goals' ? (
          <select
            name="general_objective_id"
            required
            aria-label="Objetivo geral"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Objetivo geral</option>
            {generalObjectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.code} {objective.title.slice(0, 60)}
              </option>
            ))}
          </select>
        ) : null}
        {tab === 'educational-goals' ? (
          <fieldset className="flex flex-wrap items-center gap-3 text-sm">
            <legend className="sr-only">Divisões</legend>
            {AGE_GROUP_VALUES.map((value) => (
              <label key={value} className="flex items-center gap-1">
                <input type="checkbox" name="age_groups" value={value} />
                {DIVISIONS.find((division) => division.ageGroup === value)?.name ?? value}
              </label>
            ))}
          </fieldset>
        ) : null}
        {tab !== 'sdgs' ? <Input name="code" placeholder="Código" /> : <Input name="number" placeholder="Número" type="number" />}
        <Input name="icon" placeholder="Ícone / URL" />
        <Button type="submit">Adicionar</Button>
      </form>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={String(item.id)} className="border rounded-md p-3 flex justify-between">
            <span>
              {item.code ? <span className="mr-2 font-bold">{String(item.code)}</span> : null}
              {String(item.name ?? item.title)}
            </span>
            {item.is_managed ? (
              <Badge variant="outline" title="Gerido pela Matriz Progresso Pessoal: só de leitura">
                Matriz
              </Badge>
            ) : (
              <Button
                variant="outline"
                onClick={async () => {
                  await fetch(`/api/admin/taxonomies/${tab}?id=${item.id}`, { method: 'DELETE' });
                  load();
                }}
              >
                Eliminar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
