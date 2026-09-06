'use client';

import { useLocale } from '@/components/locale/LocaleProvider';

export function SignInPageCopy() {
  const { t } = useLocale();
  return (
    <div>
      <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {t('auth.signInTitle')}
      </h2>
      <p className="mt-2 text-center text-sm text-gray-600">{t('auth.signInLead')}</p>
    </div>
  );
}

export function SignInPageHint() {
  const { t } = useLocale();
  return <p>{t('auth.signInHint')}</p>;
}
