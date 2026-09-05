'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function SignInButton() {
  const handleSignIn = () => {
    signIn('orgo', { callbackUrl: '/home' });
  };

  return (
    <Button
      onClick={handleSignIn}
      className="w-full flex items-center justify-center gap-2"
      size="lg"
    >
      Entrar com o eAEP
    </Button>
  );
}
