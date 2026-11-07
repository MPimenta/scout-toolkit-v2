/**
 * Where "Tentar novamente" goes. The worker passes the page the user was heading to as
 * `?from=`. Only a same-origin path is honoured, so the link cannot be used as an open
 * redirect; anything else (or the offline page itself) falls back to the home page.
 */
export function safeReturnPath(from: string | null | undefined): string {
  if (!from || !from.startsWith('/') || from.startsWith('//') || from.startsWith('/\\')) return '/home';
  if (from === '/offline' || from.startsWith('/offline?')) return '/home';
  return from;
}
