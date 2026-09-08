'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadButton } from '@/lib/uploadthing';

type GoalOption = { id: string; title: string; area?: { name: string } };
type ChallengeOption = { id: string; name: string; type?: { name: string } };

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
    educational_goal_ids: string[];
    challenge_ids: string[];
  }>;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState(defaults?.image_url ?? '');
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [challenges, setChallenges] = useState<ChallengeOption[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(defaults?.educational_goal_ids ?? []);
  const [selectedChallenges, setSelectedChallenges] = useState<string[]>(defaults?.challenge_ids ?? []);

  useEffect(() => {
    fetch('/api/taxonomies/educational-goals')
      .then((response) => response.json())
      .then((data) => setGoals(data.educational_goals ?? []));
    fetch('/api/taxonomies/challenges')
      .then((response) => response.json())
      .then((data) => setChallenges(data.challenges ?? []));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const body: Record<string, FormDataEntryValue | number | string[]> = Object.fromEntries(form.entries());
    body.approximate_duration_minutes = Number(body.approximate_duration_minutes);
    body.educational_goal_ids = selectedGoals;
    body.challenge_ids = selectedChallenges;
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
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Objetivos educativos</legend>
        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
          {goals.map((goal) => (
            <label key={goal.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedGoals.includes(goal.id)}
                onChange={(event) => {
                  setSelectedGoals((current) =>
                    event.target.checked ? [...current, goal.id] : current.filter((id) => id !== goal.id)
                  );
                }}
              />
              <span>
                {goal.title}
                {goal.area?.name ? <span className="block text-xs text-muted-foreground">{goal.area.name}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Desafios</legend>
        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-3">
          {challenges.map((challenge) => (
            <label key={challenge.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedChallenges.includes(challenge.id)}
                onChange={(event) => {
                  setSelectedChallenges((current) =>
                    event.target.checked ? [...current, challenge.id] : current.filter((id) => id !== challenge.id)
                  );
                }}
              />
              <span>
                {challenge.name}
                {challenge.type?.name ? (
                  <span className="block text-xs text-muted-foreground">{challenge.type.name}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
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
