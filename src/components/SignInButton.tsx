'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';

export function SignInButton() {
  const { t } = useLocale();
  const handleSignIn = () => {
    signIn('orgo', { callbackUrl: '/home' });
  };

  return (
    <Button
      onClick={handleSignIn}
      className="w-full flex items-center justify-center gap-2"
      size="lg"
    >
      {t('auth.enterEaep')}
    </Button>
  );
}
