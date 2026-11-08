import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { ViewAsProvider } from '@/components/auth/ViewAsProvider';
import { FeaturesProvider } from '@/components/providers/FeaturesProvider';
import { getEnabledFeatures, isFeatureEnabled } from '@/lib/features';
import { PWA_DARK_THEME_COLOR, PWA_THEME_COLOR } from '@/lib/pwa/manifest';
import { AppShell } from '@/components/layout/AppShell';
import { ReportLauncher } from '@/components/feedback/ReportLauncher';
import { PwaRegistrar } from '@/components/pwa/PwaRegistrar';
import { InstallProvider } from '@/components/pwa/InstallProvider';
import { Toaster } from 'sonner';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale/catalog';
import { VIEW_AS_COOKIE } from '@/lib/auth/view-as-cookie';
import './globals.css';

// Sonner's default offsets (24px, 16px on phones) plus the device safe areas (see --safe-* in globals.css).
const insetOffset = (base: string) => ({
  top: `calc(${base} + var(--safe-top))`,
  right: `calc(${base} + var(--safe-right))`,
  bottom: `calc(${base} + var(--safe-bottom))`,
  left: `calc(${base} + var(--safe-left))`,
});
const TOAST_OFFSET = insetOffset('24px');
const TOAST_MOBILE_OFFSET = insetOffset('16px');

export function generateMetadata(): Metadata {
  const pwa = isFeatureEnabled('pwa');
  return {
    title: 'Kit de Atividades - Ferramentas para Dirigentes',
    description: 'Uma plataforma para Dirigentes escotistas navegarem atividades e criarem programas',
    icons: {
      icon: { url: '/brand/favicon.png', type: 'image/png' },
      apple: '/apple-icon.png',
    },
    // PWA head metadata only with the `pwa` flag on (openspec: mobile-pwa).
    ...(pwa && {
      manifest: '/manifest.webmanifest',
      appleWebApp: { capable: true, title: 'Kit Atividades', statusBarStyle: 'default' },
      // Next emits only the unprefixed tag; older iOS Safari reads the Apple one.
      other: { 'apple-mobile-web-app-capable': 'yes' },
    }),
  };
}

// Zoom stays enabled: no maximum-scale or user-scalable here.
export function generateViewport(): Viewport {
  if (!isFeatureEnabled('pwa')) return {};
  return {
    viewportFit: 'cover',
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: PWA_THEME_COLOR },
      { media: '(prefers-color-scheme: dark)', color: PWA_DARK_THEME_COLOR },
    ],
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const enabled = getEnabledFeatures();
  // With english-locale off, chrome is Portuguese whatever the stored cookie says.
  const locale = enabled.has('english-locale')
    ? resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)
    : resolveLocale('pt');
  const viewAs = cookieStore.get(VIEW_AS_COOKIE)?.value ?? null;

  return (
    <html lang={locale}>
      <body className="font-sans">
        <FeaturesProvider enabled={[...enabled]}>
          <SessionProvider>
            <QueryProvider>
              <LocaleProvider initialLocale={locale}>
                <ViewAsProvider initialViewAs={viewAs}>
                  <InstallProvider>
                    <AppShell>{children}</AppShell>
                    {enabled.has('issue-reports') && <ReportLauncher />}
                    {enabled.has('pwa') && <PwaRegistrar />}
                    <Toaster offset={TOAST_OFFSET} mobileOffset={TOAST_MOBILE_OFFSET} />
                  </InstallProvider>
                </ViewAsProvider>
              </LocaleProvider>
            </QueryProvider>
          </SessionProvider>
        </FeaturesProvider>
      </body>
    </html>
  );
}

