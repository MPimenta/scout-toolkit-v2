'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ActivityEditorForm } from '@/components/features/activities/ActivityEditorForm';

function asStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) && value.length > 0 ? value.map(String) : fallback;
}

export default function EditAdminActivityPage() {
  const params = useParams<{ id: string }>();
  const [activity, setActivity] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`/api/activities/${params.id}`)
      .then((response) => response.json())
      .then(setActivity);
  }, [params.id]);

  if (!activity) return <div className="container mx-auto px-4 py-8">A carregar…</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editar atividade</h1>
      <ActivityEditorForm
        action={`/api/admin/activities/${params.id}`}
        submitLabel="Guardar"
        defaults={{
          name: String(activity.name ?? ''),
          description: String(activity.description ?? ''),
          materials: String(activity.materials ?? ''),
          approximate_duration_minutes: Number(activity.approximate_duration_minutes ?? 30),
          group_sizes: asStringArray(activity.group_sizes, ['medium']),
          effort_level: String(activity.effort_level ?? 'medium'),
          locations: asStringArray(activity.locations, ['outside']),
          age_groups: asStringArray(activity.age_groups, ['scouts']),
          format_id: (activity.format as { id: string } | null | undefined)?.id ?? null,
          focus_id: (activity.focus as { id: string } | null | undefined)?.id ?? null,
          secondary_focus_id: (activity.secondary_focus as { id: string } | null | undefined)?.id ?? null,
          duration_min_minutes: (activity.duration_min_minutes as number | null | undefined) ?? null,
          duration_max_minutes: (activity.duration_max_minutes as number | null | undefined) ?? null,
          instructions: typeof activity.instructions === 'string' ? activity.instructions : null,
          objectives: ((activity.objectives as Array<{ goal_id: string; age_group: string; behaviour: string | null }> | undefined) ?? []).map((row) => ({
            goal_id: row.goal_id,
            age_group: row.age_group,
            behaviour: row.behaviour ?? '',
          })),
          sdgs: ((activity.sdgs as Array<{ id: string; justification?: string | null }> | undefined) ?? []).map((sdg) => ({
            sdg_id: sdg.id,
            justification: sdg.justification ?? '',
          })),
          challenge_ids: ((activity.challenges as Array<{ id: string }> | undefined) ?? []).map((challenge) => challenge.id),
          physical_risk_level: (activity.physical_risk_level as string | null) ?? null,
          physical_risk: (activity.physical_risk as string | null) ?? null,
          physical_mitigation: (activity.physical_mitigation as string | null) ?? null,
          psychological_risk_level: (activity.psychological_risk_level as string | null) ?? null,
          psychological_risk: (activity.psychological_risk as string | null) ?? null,
          psychological_mitigation: (activity.psychological_mitigation as string | null) ?? null,
          source_id: (activity.source_id as string | null) ?? null,
          source_url: (activity.source_url as string | null) ?? null,
          image_url: String(activity.image_url ?? ''),
        }}
      />
    </div>
  );
}
