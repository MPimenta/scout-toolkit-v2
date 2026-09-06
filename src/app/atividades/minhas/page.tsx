'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MineActivity {
  id: string;
  name: string;
  is_approved: boolean;
}

export default function MyActivitiesPage() {
  const [items, setItems] = useState<MineActivity[]>([]);

  useEffect(() => {
    fetch('/api/activities/mine')
      .then((response) => response.json())
      .then((data) => setItems(data.activities ?? []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">As minhas propostas</h1>
        <Button asChild>
          <Link href="/atividades/propor">Propor atividade</Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Ainda não submeteu propostas.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border rounded-md p-3 flex justify-between gap-3">
              <Link href={`/activities/${item.id}`} className="font-medium underline">
                {item.name}
              </Link>
              <span className="text-sm text-muted-foreground">
                {item.is_approved ? 'Aprovada' : 'Pendente'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
