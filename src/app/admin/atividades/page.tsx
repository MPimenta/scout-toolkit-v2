'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminActivity {
  id: string;
  name: string;
  is_approved: boolean;
}

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);

  const load = () => {
    fetch('/api/admin/activities')
      .then((response) => response.json())
      .then((data) => setActivities(data.activities ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Atividades</h1>
        <Button asChild>
          <Link href="/admin/atividades/nova">Nova atividade</Link>
        </Button>
      </div>
      <ul className="space-y-3">
        {activities.map((activity) => (
          <li key={activity.id} className="border rounded-md p-3 flex justify-between gap-3">
            <div>
              <Link href={`/admin/atividades/${activity.id}`} className="font-medium underline">
                {activity.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {activity.is_approved ? 'Publicada' : 'Pendente'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch(`/api/admin/activities/${activity.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ is_approved: !activity.is_approved }),
                });
                load();
              }}
            >
              {activity.is_approved ? 'Despublicar' : 'Aprovar'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
