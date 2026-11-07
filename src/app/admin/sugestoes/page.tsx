'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { parseCategoryValue } from '@/lib/suggestions/fields';

interface Suggestion {
  id: string;
  activity_id: string;
  field: string;
  suggested_value: string;
}

/** Category suggestions are stored as JSON arrays; show them as a plain list. */
function formatSuggestedValue(value: string): string {
  if (!value.startsWith('[')) return value;
  const list = parseCategoryValue(value);
  return list.length > 0 ? list.join(', ') : value;
}

export default function AdminSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([]);

  const load = () => {
    fetch('/api/admin/suggestions')
      .then((response) => response.json())
      .then((data) => setItems(data.suggestions ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sugestões</h1>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border rounded-md p-3">
            <p className="font-bold">{item.field}</p>
            <p className="text-sm mb-3">{formatSuggestedValue(item.suggested_value)}</p>
            <div className="flex gap-2">
              <Button onClick={async () => {
                await fetch(`/api/admin/suggestions/${item.id}/review`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ decision: 'approved' }),
                });
                load();
              }}>Aceitar</Button>
              <Button variant="outline" onClick={async () => {
                await fetch(`/api/admin/suggestions/${item.id}/review`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ decision: 'rejected' }),
                });
                load();
              }}>Recusar</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
