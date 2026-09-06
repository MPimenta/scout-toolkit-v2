'use client';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="flex items-center rounded-md border"
      role="group"
      aria-label={t('locale.label')}
    >
      <Button
        type="button"
        variant={locale === 'pt' ? 'secondary' : 'ghost'}
        size="sm"
        className="min-h-11 min-w-11 px-2"
        aria-pressed={locale === 'pt'}
        onClick={() => setLocale('pt')}
      >
        {t('locale.pt')}
      </Button>
      <Button
        type="button"
        variant={locale === 'en' ? 'secondary' : 'ghost'}
        size="sm"
        className="min-h-11 min-w-11 px-2"
        aria-pressed={locale === 'en'}
        onClick={() => setLocale('en')}
      >
        {t('locale.en')}
      </Button>
    </div>
  );
}
