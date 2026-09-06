'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadButton } from '@/lib/uploadthing';

export function ActivityEditorForm({
  action,
  defaults,
  submitLabel,
  redirectTo = '/admin/atividades',
}: {
  action: string;
  redirectTo?: string;
  method?: string;
  defaults?: Partial<{
    name: string;
    description: string;
    materials: string;
    approximate_duration_minutes: number;
    group_size: string;
    effort_level: string;
    location: string;
    age_group: string;
    activity_type_id: string;
    image_url: string;
  }>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState(defaults?.image_url ?? '');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body: Record<string, FormDataEntryValue | number> = Object.fromEntries(form.entries());
    body.approximate_duration_minutes = Number(body.approximate_duration_minutes);
    const response = await fetch(action, {
      method: defaults?.name ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      setError('Não foi possível guardar a atividade.');
      setBusy(false);
      return;
    }
    window.location.href = redirectTo;
  }

  return (
    <form className="space-y-4 max-w-xl" onSubmit={onSubmit}>
      <Field name="name" label="Nome" defaultValue={defaults?.name} />
      <Field name="description" label="Descrição" defaultValue={defaults?.description} />
      <Field name="materials" label="Materiais" defaultValue={defaults?.materials} />
      <Field name="approximate_duration_minutes" label="Duração (min)" type="number" defaultValue={defaults?.approximate_duration_minutes} />
      <Field name="group_size" label="Grupo" defaultValue={defaults?.group_size ?? 'medium'} />
      <Field name="effort_level" label="Esforço" defaultValue={defaults?.effort_level ?? 'medium'} />
      <Field name="location" label="Local" defaultValue={defaults?.location ?? 'outside'} />
      <Field name="age_group" label="Secção" defaultValue={defaults?.age_group ?? 'scouts'} />
      <Field name="activity_type_id" label="ID do tipo" defaultValue={defaults?.activity_type_id} />
      <div className="space-y-1">
        <Label htmlFor="image_url">URL da imagem (HTTPS)</Label>
        <Input
          id="image_url"
          name="image_url"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        />
        <UploadButton
          endpoint="activityImage"
          onClientUploadComplete={(files) => {
            const uploaded = files[0]?.ufsUrl ?? files[0]?.url;
            if (uploaded) setImageUrl(uploaded);
          }}
          onUploadError={(uploadError) => setError(uploadError.message)}
          content={{ button: 'Carregar imagem' }}
        />
      </div>
      {error ? <p className="text-destructive">{error}</p> : null}
      <Button type="submit" disabled={busy}>{submitLabel}</Button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = 'text',
  required = true,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} />
    </div>
  );
}
