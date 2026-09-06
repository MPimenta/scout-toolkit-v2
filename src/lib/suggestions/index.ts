import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities, editSuggestions, notifications, user } from '../../../drizzle/schema';
import type { SuggestableField } from './fields';

export { SUGGESTABLE_FIELDS, isSuggestableField, type SuggestableField } from './fields';

export async function notifyAdmins(
  title: string,
  body: string,
  href: string,
  type = 'suggestion_submitted'
) {
  const admins = await db.select({ id: user.id }).from(user).where(eq(user.role, 'admin'));
  if (admins.length === 0) return;
  await db.insert(notifications).values(
    admins.map((admin) => ({
      user_id: admin.id,
      type,
      title,
      body,
      href,
    }))
  );
}

export async function notifyUser(userId: string, type: string, title: string, body: string, href: string) {
  await db.insert(notifications).values({
    user_id: userId,
    type,
    title,
    body,
    href,
  });
}

export async function applySuggestion(field: SuggestableField, value: string, activityId: string) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  patch[field] = field === 'approximate_duration_minutes' ? Number(value) : value;
  await db.update(activities).set(patch).where(eq(activities.id, activityId));
}

export async function findPendingDuplicate(activityId: string, userId: string, field: string) {
  const [row] = await db
    .select({ id: editSuggestions.id })
    .from(editSuggestions)
    .where(and(
      eq(editSuggestions.activity_id, activityId),
      eq(editSuggestions.user_id, userId),
      eq(editSuggestions.field, field),
      eq(editSuggestions.status, 'pending')
    ))
    .limit(1);
  return row;
}
