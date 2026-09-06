'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';

interface IssueReport {
  id: string;
  kind: string;
  message: string;
  contact_email: string | null;
  path: string;
  locale: string;
  status: 'aberto' | 'fechado';
  user_name: string | null;
  user_email: string | null;
}

export default function AdminReportsPage() {
  const { t } = useLocale();
  const [openOnly, setOpenOnly] = useState(true);
  const [items, setItems] = useState<IssueReport[]>([]);

  const load = useCallback(() => {
    const query = openOnly ? '?status=aberto' : '';
    fetch(`/api/admin/reports${query}`)
      .then((response) => response.json())
      .then((data) => setItems(data.reports ?? []));
  }, [openOnly]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{t('admin.reports')}</h1>
      <label className="mb-6 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={openOnly}
          onChange={(event) => setOpenOnly(event.target.checked)}
        />
        {t('admin.filterOpen')}
      </label>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{t('admin.reportEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border rounded-md p-3">
              <p className="font-medium">
                {item.kind} · {item.path}
              </p>
              <p className="text-sm mb-2">{item.message}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {item.user_name || item.user_email || item.contact_email || '—'} · {item.locale} · {item.status}
              </p>
              {item.status === 'aberto' ? (
                <Button
                  onClick={async () => {
                    await fetch(`/api/admin/reports/${item.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'fechado' }),
                    });
                    load();
                  }}
                >
                  {t('admin.closeReport')}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
