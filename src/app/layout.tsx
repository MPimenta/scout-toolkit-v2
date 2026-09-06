import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from 'sonner';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale/catalog';
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

  return (
    <html lang={locale}>
      <body className="font-sans">
        <SessionProvider>
          <QueryProvider>
            <LocaleProvider initialLocale={locale}>
              <AppShell>{children}</AppShell>
              <Toaster />
            </LocaleProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

