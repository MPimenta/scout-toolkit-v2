'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: 'user' | 'admin';
  program_count: number;
  review_count: number;
  activity_count: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');

  const load = () => {
    fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
      .then((response) => response.json())
      .then((data) => setUsers(data.users ?? []));
  };

  useEffect(() => {
    load();
  }, [q]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Utilizadores</h1>
      <Input className="mb-4 max-w-sm" placeholder="Pesquisar nome ou email" value={q} onChange={(event) => setQ(event.target.value)} />
      <ul className="space-y-3">
        {users.map((item) => (
          <li key={item.id} className="border rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="font-medium">{item.name || item.email}</p>
              <p className="text-sm text-muted-foreground">
                {item.email} · {item.program_count} programas · {item.review_count} avaliações · {item.activity_count} atividades
              </p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await fetch(`/api/admin/users/${item.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ role: item.role === 'admin' ? 'user' : 'admin' }),
                });
                load();
              }}
            >
              {item.role === 'admin' ? 'Tornar utilizador' : 'Tornar admin'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
