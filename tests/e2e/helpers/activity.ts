import type { APIRequestContext } from '@playwright/test';

export async function firstActivityId(request: APIRequestContext): Promise<string> {
  const response = await request.get('/api/activities?limit=1');
  if (!response.ok()) {
    throw new Error(`Failed to list activities: ${response.status()}`);
  }
  const body = (await response.json()) as { activities: { id: string }[] };
  const id = body.activities[0]?.id;
  if (!id) {
    throw new Error('No activities available for E2E ratings');
  }
  return id;
}
