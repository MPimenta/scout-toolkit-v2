'use client';

import Image from 'next/image';
import { useLocale } from '@/components/locale/LocaleProvider';

export function SignInPageCopy() {
  const { t } = useLocale();
  return (
    <div className="text-center">
      <Image
        src="/brand/marca_aep.png"
        alt="Escoteiros de Portugal"
        width={200}
        height={61}
        className="mx-auto h-12 w-auto"
        priority
        unoptimized
      />
      <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground">{t('auth.signInTitle')}</h1>
      <p className="mt-2 text-base text-muted-foreground">{t('auth.signInLead')}</p>
      <p className="mt-4 text-sm text-foreground">{t('auth.signInPitch')}</p>
    </div>
  );
}

export function SignInPageHint() {
  const { t } = useLocale();
  return <p className="text-muted-foreground">{t('auth.signInHint')}</p>;
}
