import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  activityActivityTypes,
  activityAgeGroups,
  activityGroupSizes,
  activityLocations,
  activityTypes,
  editSuggestions,
  notifications,
  user,
} from '../../../drizzle/schema';
import { AGE_GROUP_VALUES, GROUP_SIZE_VALUES, LOCATION_VALUES } from '@/lib/activities/category-values';
import { isCategoryField, parseCategoryValue, type CategoryField, type SuggestableField } from './fields';

export {
  SUGGESTABLE_FIELDS,
  CATEGORY_FIELDS,
  isSuggestableField,
  isCategoryField,
  parseCategoryValue,
  type SuggestableField,
  type CategoryField,
} from './fields';

const ENUM_VALUES: Record<Exclude<CategoryField, 'activity_types'>, readonly string[]> = {
  group_sizes: GROUP_SIZE_VALUES,
  locations: LOCATION_VALUES,
  age_groups: AGE_GROUP_VALUES,
};

/**
 * Turns a user-supplied list into the stored JSON array for a category field.
 * Returns an error message when the list is empty or holds an unknown value.
 * Activity types may be given as ids or (case-insensitive) names and are stored as ids.
 */
export async function normalizeCategorySuggestion(
  field: CategoryField,
  raw: unknown
): Promise<{ value: string } | { error: string }> {
  const items = (Array.isArray(raw) ? raw : String(raw ?? '').split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);
  if (items.length === 0) return { error: 'Indique pelo menos um valor' };

  if (field !== 'activity_types') {
    const allowed = ENUM_VALUES[field];
    if (!items.every((item) => allowed.includes(item))) return { error: 'Valor inválido' };
    return { value: JSON.stringify([...new Set(items)]) };
  }

  const types = await db.select({ id: activityTypes.id, name: activityTypes.name }).from(activityTypes);
  const ids: string[] = [];
  for (const item of items) {
    const match = types.find((type) => type.id === item || type.name.toLowerCase() === item.toLowerCase());
    if (!match) return { error: 'Tipo de atividade inválido' };
    if (!ids.includes(match.id)) ids.push(match.id);
  }
  return { value: JSON.stringify(ids) };
}

async function replaceCategory(field: CategoryField, values: string[], activityId: string) {
  await db.transaction(async (tx) => {
    if (field === 'group_sizes') {
      await tx.delete(activityGroupSizes).where(eq(activityGroupSizes.activity_id, activityId));
      await tx.insert(activityGroupSizes).values(
        values.map((group_size) => ({ activity_id: activityId, group_size: group_size as (typeof GROUP_SIZE_VALUES)[number] }))
      );
    } else if (field === 'locations') {
      await tx.delete(activityLocations).where(eq(activityLocations.activity_id, activityId));
      await tx.insert(activityLocations).values(
        values.map((location) => ({ activity_id: activityId, location: location as (typeof LOCATION_VALUES)[number] }))
      );
    } else if (field === 'age_groups') {
      await tx.delete(activityAgeGroups).where(eq(activityAgeGroups.activity_id, activityId));
      await tx.insert(activityAgeGroups).values(
        values.map((age_group) => ({ activity_id: activityId, age_group: age_group as (typeof AGE_GROUP_VALUES)[number] }))
      );
    } else {
      await tx.delete(activityActivityTypes).where(eq(activityActivityTypes.activity_id, activityId));
      await tx.insert(activityActivityTypes).values(
        values.map((activity_type_id) => ({ activity_id: activityId, activity_type_id }))
      );
    }
    await tx.update(activities).set({ updated_at: new Date() }).where(eq(activities.id, activityId));
  });
}

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
  if (isCategoryField(field)) {
    const values = [...new Set(parseCategoryValue(value))];
    if (values.length === 0) throw new Error('Sugestão de categoria inválida');
    await replaceCategory(field, values, activityId);
    return;
  }
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
