export { auth as middleware } from "../../../auth"

export const config = {
  matcher: [
    '/admin/:path*',
    '/programs/:path*',
    '/auth/:path*',
    '/api/admin/:path*',
    '/api/programs/:path*',
    '/api/activities/:path*',
  ],
};
