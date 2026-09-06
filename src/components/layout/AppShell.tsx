'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ViewAsBanner } from '@/components/auth/ViewAsBanner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith('/auth/');

  if (isAuth) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <ViewAsBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
