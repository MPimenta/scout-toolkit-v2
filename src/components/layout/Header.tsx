'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SignInButton } from '@/components/auth/SignInButton';
import { LocaleSwitcher } from '@/components/locale/LocaleSwitcher';
import { useLocale } from '@/components/locale/LocaleProvider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Header() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const { t } = useLocale();
  const isAdmin = session?.user?.role === 'admin';

  const links = [
    { href: '/activities', label: t('nav.activities') },
    { href: '/programs', label: t('nav.programs') },
    { href: '/programs/public', label: t('nav.publicPrograms') },
    { href: '/about', label: t('nav.about') },
    ...(isAdmin ? [{ href: '/admin', label: t('nav.admin') }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center min-h-11">
          <Image
            src="/brand/marca_aep.png"
            alt="Escoteiros de Portugal"
            width={200}
            height={61}
            className="h-8 md:h-10 w-auto max-w-[140px] md:max-w-none object-contain"
            priority
            unoptimized
          />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors hover:text-secondary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <SignInButton />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden min-h-11 min-w-11"
                aria-label={t('nav.openMenu')}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100dvw,20rem)]">
              <SheetHeader>
                <SheetTitle>{t('nav.menu')}</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="min-h-11 flex items-center px-3 rounded-md text-base font-medium hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
