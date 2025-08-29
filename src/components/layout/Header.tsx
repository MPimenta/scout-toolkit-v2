import Link from 'next/link';
import Image from 'next/image';

import { SignInButton } from '@/components/auth/SignInButton';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo_escoteiros.png"
              alt="Escoteiros de Portugal"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-primary">Scout Toolkit</span>
              <span className="text-xs text-muted-foreground">Ferramentas para Líderes</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/activities" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Atividades
          </Link>
          <Link 
            href="/programs" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Programas
          </Link>
          <Link 
            href="/about" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Sobre
          </Link>
        </nav>

        {/* Auth */}
        <div className="flex items-center space-x-4">
          <SignInButton />
        </div>
      </div>
    </header>
  );
}
