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

/** Ids of the format Jogo and the focus Cooperação, which an activity write needs. */
export async function formatAndFocus(request: APIRequestContext): Promise<{ format_id: string; focus_id: string }> {
  const formats = (await (await request.get('/api/taxonomies/activity-formats')).json()) as { activity_formats: { id: string; code: string }[] };
  const focuses = (await (await request.get('/api/taxonomies/activity-focuses')).json()) as { activity_focuses: { id: string; code: string }[] };
  const format = formats.activity_formats.find((f) => f.code === 'jogo');
  const focus = focuses.activity_focuses.find((f) => f.code === 'cooperacao');
  if (!format || !focus) throw new Error('Formats and focuses are not loaded in the E2E database');
  return { format_id: format.id, focus_id: focus.id };
}
