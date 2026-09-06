'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ActivityEditorForm } from '@/components/features/activities/ActivityEditorForm';

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
          group_size: String(activity.group_size ?? 'medium'),
          effort_level: String(activity.effort_level ?? 'medium'),
          location: String(activity.location ?? 'outside'),
          age_group: String(activity.age_group ?? 'scouts'),
          activity_type_id: String((activity.activity_type as { id?: string } | undefined)?.id ?? ''),
          image_url: String(activity.image_url ?? ''),
        }}
      />
    </div>
  );
}
