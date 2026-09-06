'use client';

import { useLocale } from '@/components/locale/LocaleProvider';
import { Button } from '@/components/ui/button';
import { useViewAs } from './ViewAsProvider';

export function ViewAsBanner() {
  const { t } = useLocale();
  const { viewingAsMember, setViewingAsMember } = useViewAs();

  if (!viewingAsMember) return null;

  return (
    <div className="border-b bg-muted px-4 py-2">
      <div className="container flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">{t('admin.viewingAsMember')}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          onClick={() => setViewingAsMember(false)}
        >
          {t('admin.backToAdmin')}
        </Button>
      </div>
    </div>
  );
}
