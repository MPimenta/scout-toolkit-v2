'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUGGESTABLE_FIELDS, isCategoryField } from '@/lib/suggestions/fields';

export function SuggestEditForm({ activityId }: { activityId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = String(form.get('field') ?? '');
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

  return (
    <form className="space-y-3 border rounded-md p-4" onSubmit={onSubmit}>
      <h2 className="font-bold">Sugerir alteração</h2>
      <select name="field" className="border rounded-md h-10 px-3 w-full" aria-label="Campo">
        {SUGGESTABLE_FIELDS.map((field) => (
          <option key={field} value={field}>{field}</option>
        ))}
      </select>
      <Input name="suggested_value" placeholder="Novo valor (listas: valores separados por vírgula)" required />
      <Button type="submit">Enviar sugestão</Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
