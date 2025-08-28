'use client';

import { useTranslations } from 'next-intl';

export function SignInContent() {
  const t = useTranslations('auth');
  
  return t('signInTitle');
}
