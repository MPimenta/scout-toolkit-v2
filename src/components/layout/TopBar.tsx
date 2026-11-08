'use client';

import { useLocale } from '@/components/locale/LocaleProvider';

/** Cross-site links, same destinations as the public site's top bar. */
const LINKS = [
  { key: 'eaep', href: 'https://eaep.escoteiros.pt/' },
  { key: 'site', href: 'https://escoteiros.pt/' },
  { key: 'centers', href: 'https://centros.escoteiros.pt/' },
  { key: 'shop', href: 'https://loja.escoteiros.pt/' },
] as const;

/**
 * Slim Azul AEP bar above the header (public site pattern): cross-site links on
 * the left, the association name in the middle. Links are hidden on phones and
 * the name on narrow screens, as on escoteiros.pt.
 */
export function TopBar() {
  const { t } = useLocale();

  return (
    <div className="on-blue bg-primary pt-[var(--safe-top)] text-primary-foreground">
      <div className="container relative flex h-8 items-center justify-between gap-6 text-xs">
        <nav aria-label={t('topBar.label')} className="hidden gap-7 whitespace-nowrap sm:flex">
          {LINKS.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {t(`topBar.${link.key}`)}
              <span aria-hidden="true" className="ml-1">
                ↗
              </span>
              <span className="sr-only"> {t('topBar.opensNewTab')}</span>
            </a>
          ))}
        </nav>
        <p className="mx-auto whitespace-nowrap font-bold sm:mx-0 md:absolute md:left-1/2 md:-translate-x-1/2">
          {t('topBar.association')}
        </p>
      </div>
    </div>
  );
}
