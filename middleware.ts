import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['pt', 'en'],
  
  // Used when no locale matches
  defaultLocale: 'pt',
  
  // Always show the locale in the URL
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  // Handle internationalization first
  const response = intlMiddleware(request);
  
  // Get the pathname after locale processing
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1];
  
  // Skip auth middleware for auth-related paths and API routes
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/uploadthing')
  ) {
    return response;
  }
  
  // Apply authentication middleware for protected routes
  const authResult = await auth();
  const isAuth = !!authResult;
  const isAuthPage = pathname.includes('/auth');
  const isAdminPage = pathname.includes('/admin');
  const isApiAdminRoute = pathname.includes('/api/admin');
  const isProgramsPage = pathname.includes('/programs');
  const isApiProgramsRoute = pathname.includes('/api/programs');

  // Redirect authenticated users away from auth pages
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    return response;
  }

  // Protect admin routes
  if (isAdminPage || isApiAdminRoute) {
    if (!isAuth) {
      return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
    }
    
    if (authResult?.user?.role !== 'admin') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // Protect authenticated routes
  if (!isAuth && (isProgramsPage || isApiProgramsRoute)) {
    return NextResponse.redirect(new URL(`/${locale}/auth/signin`, request.url));
  }

  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(pt|en)/:path*']
};
