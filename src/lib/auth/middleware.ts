// TODO: Fix NextAuth v5 beta compatibility
// import { withAuth } from 'next-auth/middleware';
// import { NextResponse } from 'next/server';

// export default withAuth(
//   function middleware(req) {
//     const token = req.nextauth.token;
//     const isAuth = !!token;
//     const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
//     const isAdminPage = req.nextUrl.pathname.startsWith('/admin');
//     const isApiAdminRoute = req.nextUrl.pathname.startsWith('/api/admin');

//     // Redirect authenticated users away from auth pages
//     if (isAuthPage) {
//       if (isAuth) {
//         return NextResponse.redirect(new URL('/', req.url));
//       }
//       return null;
//     }

//     // Protect admin routes
//     if (isAdminPage || isApiAdminRoute) {
//       if (!isAuth) {
//         return NextResponse.redirect(new URL('/auth/signin', req.url));
//       }
      
//       if (token?.role !== 'admin') {
//         return NextResponse.redirect(new URL('/', req.url));
//       }
//     }

//     // Protect authenticated routes
//     if (!isAuth && (
//       req.nextUrl.pathname.startsWith('/programs') ||
//       req.nextUrl.pathname.startsWith('/api/programs') ||
//       req.nextUrl.pathname.startsWith('/api/activities') && req.method !== 'GET'
//     )) {
//       return NextResponse.redirect(new URL('/auth/signin', req.url));
//     }

//     return NextResponse.next();
//   },
//   {
//     callbacks: {
//       authorized: ({ token }) => !!token,
//     },
//   }
// );

// export const config = {
//   matcher: [
//     '/admin/:path*',
//     '/programs/:path*',
//     '/auth/:path*',
//     '/api/admin/:path*',
//     '/api/programs/:path*',
//     '/api/activities/:path*',
//   ],
// };

// Temporary placeholder middleware
export function middleware() {
  // Middleware temporarily disabled
}

export const config = {
  matcher: [],
};
