'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { SignInButton } from '@/components/auth/SignInButton';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-4" onClick={closeMobileMenu}>
            <div className="h-12 flex items-center">
              <Image
                src="/logo_escoteiros.png"
                alt="Escoteiros de Portugal"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
                unoptimized
              />
            </div>

          </Link>
        </div>

        {/* Desktop Navigation */}
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

        {/* Auth and Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          <SignInButton />
          
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            <Link
              href="/activities"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={closeMobileMenu}
            >
              Atividades
            </Link>
            <Link
              href="/programs"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={closeMobileMenu}
            >
              Programas
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={closeMobileMenu}
            >
              Sobre
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
