'use client';

import Link from 'next/link';
import { useLocale } from '@/components/locale/LocaleProvider';

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="on-blue border-t bg-blue-dark text-primary-foreground">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-primary-foreground md:text-left">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/privacy"
            className="text-sm font-bold text-primary-foreground underline-offset-4 hover:text-teal-light hover:underline"
          >
            {t('footer.privacy')}
          </Link>
          <Link
            href="/terms"
            className="text-sm font-bold text-primary-foreground underline-offset-4 hover:text-teal-light hover:underline"
          >
            {t('footer.terms')}
          </Link>
          <Link
            href="https://github.com/MPimenta/scout-toolkit-v2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-primary-foreground underline-offset-4 hover:text-teal-light hover:underline"
          >
            {t('footer.github')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
