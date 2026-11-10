'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUGGESTABLE_FIELDS, isCategoryField, isValueField, type SuggestableField } from '@/lib/suggestions/fields';

interface ValueOption {
  id: string;
  name: string;
}

/** What the person sees for each field they can suggest a change to. */
const FIELD_LABELS: Record<SuggestableField, string> = {
  name: 'Nome',
  description: 'Descrição',
  materials: 'Materiais',
  instructions: 'Instruções',
  approximate_duration_minutes: 'Duração (minutos)',
  group_sizes: 'Tamanho do grupo',
  effort_level: 'Nível de esforço',
  locations: 'Local',
  age_groups: 'Faixa etária',
  format_id: 'Formato',
  focus_id: 'Foco principal',
  secondary_focus_id: 'Foco secundário',
};

async function loadOptions(kind: 'activity-formats' | 'activity-focuses', key: 'activity_formats' | 'activity_focuses'): Promise<ValueOption[]> {
  const response = await fetch(`/api/taxonomies/${kind}`);
  if (!response.ok) return [];
  return ((await response.json()) as Record<string, ValueOption[]>)[key] ?? [];
}

export function SuggestEditForm({ activityId }: { activityId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [field, setField] = useState<SuggestableField>(SUGGESTABLE_FIELDS[0]);
  const [formats, setFormats] = useState<ValueOption[]>([]);
  const [focuses, setFocuses] = useState<ValueOption[]>([]);

  useEffect(() => {
    if (!isValueField(field)) return;
    if (field === 'format_id' && formats.length === 0) void loadOptions('activity-formats', 'activity_formats').then(setFormats);
    if (field !== 'format_id' && focuses.length === 0) void loadOptions('activity-focuses', 'activity_focuses').then(setFocuses);
  }, [field, formats.length, focuses.length]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawValue = String(form.get('suggested_value') ?? '');
    const response = await fetch(`/api/activities/${activityId}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field,
        // Category fields take a list: comma-separated in the input.
        suggested_value: isCategoryField(field)
          ? rawValue.split(',').map((item) => item.trim()).filter(Boolean)
          : rawValue,
      }),
    });
    setMessage(response.ok ? 'Sugestão enviada.' : 'Não foi possível enviar a sugestão.');
  }

  const options = field === 'format_id' ? formats : focuses;

  return (
    <form className="space-y-3 border rounded-md p-4" onSubmit={onSubmit}>
      <h2 className="font-bold">Sugerir alteração</h2>
      <select
        name="field"
        className="border rounded-md h-10 px-3 w-full"
        aria-label="Campo"
        value={field}
        onChange={(event) => setField(event.target.value as SuggestableField)}
      >
        {SUGGESTABLE_FIELDS.map((item) => (
          <option key={item} value={item}>{FIELD_LABELS[item]}</option>
        ))}
      </select>
      {isValueField(field) ? (
        <select name="suggested_value" className="border rounded-md h-10 px-3 w-full" aria-label="Novo valor" required defaultValue="">
          <option value="" disabled>Escolha um valor</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      ) : (
        <Input name="suggested_value" placeholder="Novo valor (listas: valores separados por vírgula)" required />
      )}
      <Button type="submit">Enviar sugestão</Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
