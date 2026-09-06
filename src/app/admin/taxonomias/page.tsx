'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TABS = [
  { id: 'activity-types', label: 'Tipos', list: '/api/taxonomies/activity-types', key: 'activity_types' },
  { id: 'educational-areas', label: 'Áreas', list: '/api/taxonomies/educational-areas', key: 'educational_areas' },
  { id: 'educational-goals', label: 'Objetivos', list: '/api/taxonomies/educational-goals', key: 'educational_goals' },
  { id: 'sdgs', label: 'ODS', list: '/api/taxonomies/sdgs', key: 'sdgs' },
] as const;

export default function AdminTaxonomiesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('activity-types');
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const current = TABS.find((item) => item.id === tab)!;

  const load = () => {
    fetch(current.list)
      .then((response) => response.json())
      .then((data) => setItems(data[current.key] ?? []));
  };

  useEffect(() => {
    load();
  }, [tab]);

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
          await fetch(`/api/admin/taxonomies/${tab}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(form.entries())),
          });
          load();
        }}
      >
        <Input name="name" placeholder="Nome" required={tab !== 'educational-goals'} />
        {tab === 'educational-goals' ? <Input name="title" placeholder="Título" required /> : null}
        {tab === 'educational-goals' ? <Input name="area_id" placeholder="ID da área" required /> : null}
        {tab !== 'sdgs' ? <Input name="code" placeholder="Código" /> : <Input name="number" placeholder="Número" type="number" />}
        <Input name="icon" placeholder="Ícone / URL" />
        <Button type="submit">Adicionar</Button>
      </form>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={String(item.id)} className="border rounded-md p-3 flex justify-between">
            <span>{String(item.name ?? item.title)}</span>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch(`/api/admin/taxonomies/${tab}?id=${item.id}`, { method: 'DELETE' });
                load();
              }}
            >
              Eliminar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
