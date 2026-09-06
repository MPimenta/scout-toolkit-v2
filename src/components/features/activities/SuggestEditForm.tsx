'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SUGGESTABLE_FIELDS } from '@/lib/suggestions/fields';

export function SuggestEditForm({ activityId }: { activityId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/activities/${activityId}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field: form.get('field'),
        suggested_value: form.get('suggested_value'),
      }),
    });
    setMessage(response.ok ? 'Sugestão enviada.' : 'Não foi possível enviar a sugestão.');
  }

  return (
    <form className="space-y-3 border rounded-md p-4" onSubmit={onSubmit}>
      <h2 className="font-semibold">Sugerir alteração</h2>
      <select name="field" className="border rounded-md h-10 px-3 w-full" aria-label="Campo">
        {SUGGESTABLE_FIELDS.map((field) => (
          <option key={field} value={field}>{field}</option>
        ))}
      </select>
      <Input name="suggested_value" placeholder="Novo valor" required />
      <Button type="submit">Enviar sugestão</Button>
      {message ? <p className="text-sm">{message}</p> : null}
    </form>
  );
}
