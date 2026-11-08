'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { SignInButton } from '@/components/auth/SignInButton';
import { LocaleSwitcher } from '@/components/locale/LocaleSwitcher';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useViewAs } from '@/components/auth/ViewAsProvider';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { InstallEntry } from '@/components/pwa/InstallEntry';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/** Current when the path is the link or below it, unless a longer link matches better. */
function isCurrent(pathname: string, href: string, all: string[]): boolean {
  const matches = (h: string) => pathname === h || pathname.startsWith(h + '/');
  if (!matches(href)) return false;
  return !all.some((other) => other.length > href.length && matches(other));
}

export function Header() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname() ?? '';
  const { t } = useLocale();
  const { effectiveIsAdmin } = useViewAs();
  const isAdmin = effectiveIsAdmin && Boolean(session?.user);
  const showPublicPrograms = useFeature('public-programs');
  const showLocaleSwitcher = useFeature('english-locale');

  const links = [
    { href: '/activities', label: t('nav.activities') },
    { href: '/programs', label: t('nav.programs') },
    ...(showPublicPrograms ? [{ href: '/programs/public', label: t('nav.publicPrograms') }] : []),
    { href: '/about', label: t('nav.about') },
    ...(isAdmin ? [{ href: '/admin', label: t('nav.admin') }] : []),
  ];

  return (
    <header className="sticky top-[var(--safe-top)] z-50 w-full border-b bg-background">
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
          {links.map((link) => {
            const current = isCurrent(pathname, link.href, links.map((l) => l.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={`border-b-[3px] py-1 text-sm font-bold transition-colors hover:border-accent hover:text-primary ${
                  current ? 'border-accent text-primary' : 'border-transparent'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showLocaleSwitcher && <LocaleSwitcher />}
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
            <SheetContent side="right" className="w-[min(100dvw,20rem)] pb-[var(--safe-bottom)]">
              <SheetHeader>
                <SheetTitle>{t('nav.menu')}</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="min-h-11 flex items-center px-3 rounded-md text-base font-bold hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <InstallEntry variant="menu" onActivate={() => setOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
