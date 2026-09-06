import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { ViewAsProvider } from '@/components/auth/ViewAsProvider';
import { AppShell } from '@/components/layout/AppShell';
import { ReportLauncher } from '@/components/feedback/ReportLauncher';
import { Toaster } from 'sonner';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale/catalog';
import { VIEW_AS_COOKIE } from '@/lib/auth/view-as-cookie';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kit de Atividades - Ferramentas para Dirigentes',
  description: 'Uma plataforma para Dirigentes escotistas navegarem atividades e criarem programas',
  icons: {
    icon: { url: '/brand/favicon.png', type: 'image/png' },
    apple: '/apple-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const viewAs = cookieStore.get(VIEW_AS_COOKIE)?.value ?? null;

  return (
    <html lang={locale}>
      <body className="font-sans">
        <SessionProvider>
          <QueryProvider>
            <LocaleProvider initialLocale={locale}>
              <ViewAsProvider initialViewAs={viewAs}>
                <AppShell>{children}</AppShell>
                <ReportLauncher />
                <Toaster />
              </ViewAsProvider>
            </LocaleProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

