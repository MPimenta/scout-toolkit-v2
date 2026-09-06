import type { APIRequestContext, Page } from '@playwright/test';

export async function signInE2E(
  request: APIRequestContext,
  options: { email?: string; name?: string; role?: 'user' | 'admin' } = {}
) {
  const response = await request.post('/api/e2e/session', {
    data: {
      email: options.email ?? `e2e.${crypto.randomUUID()}@example.com`,
      name: options.name ?? 'Chefe E2E',
      role: options.role ?? 'user',
    },
  });
  return response;
}

export async function signOutE2E(request: APIRequestContext) {
  await request.delete('/api/e2e/session');
}

export async function expandActivityFilters(page: Page) {
  const expand = page.getByRole('button', { name: /expandir/i });
  if (await expand.isVisible()) {
    await expand.click();
  }
}
