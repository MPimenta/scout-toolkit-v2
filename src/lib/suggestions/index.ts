import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  activityAgeGroups,
  activityGroupSizes,
  activityFocuses,
  activityFormats,
  activityLocations,
  editSuggestions,
  notifications,
  user,
} from '../../../drizzle/schema';
import { AGE_GROUP_VALUES, GROUP_SIZE_VALUES, LOCATION_VALUES } from '@/lib/activities/category-values';
import { isCategoryField, parseCategoryValue, type CategoryField, type SuggestableField, type ValueField } from './fields';

export {
  SUGGESTABLE_FIELDS,
  CATEGORY_FIELDS,
  isSuggestableField,
  isCategoryField,
  parseCategoryValue,
  isValueField,
  VALUE_FIELDS,
  type ValueField,
  type SuggestableField,
  type CategoryField,
} from './fields';

const ENUM_VALUES: Record<CategoryField, readonly string[]> = {
  group_sizes: GROUP_SIZE_VALUES,
  locations: LOCATION_VALUES,
  age_groups: AGE_GROUP_VALUES,
};

/**
 * Turns a user-supplied list into the stored JSON array for a category field.
 * Returns an error message when the list is empty or holds an unknown value.
 */
export async function normalizeCategorySuggestion(
  field: CategoryField,
  raw: unknown
): Promise<{ value: string } | { error: string }> {
  const items = (Array.isArray(raw) ? raw : String(raw ?? '').split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);
  if (items.length === 0) return { error: 'Indique pelo menos um valor' };

  const allowed = ENUM_VALUES[field];
  if (!items.every((item) => allowed.includes(item))) return { error: 'Valor inválido' };
  return { value: JSON.stringify([...new Set(items)]) };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks a suggestion for the format, the main focus or the secondary focus: the value must be the
 * id of an existing format or focus, and the main focus must end up different from the secondary
 * focus (read from the activity as it is now). Returns a Portuguese message, or null when valid.
 */
export async function checkValueSuggestion(field: ValueField, value: string, activityId: string): Promise<string | null> {
  if (!UUID_RE.test(value)) return 'Valor inválido';
  if (field === 'format_id') {
    const [format] = await db.select({ id: activityFormats.id }).from(activityFormats).where(eq(activityFormats.id, value));
    return format ? null : 'Formato inválido';
  }
  const [focus] = await db.select({ id: activityFocuses.id }).from(activityFocuses).where(eq(activityFocuses.id, value));
  if (!focus) return field === 'focus_id' ? 'Foco inválido' : 'Foco secundário inválido';
  const [current] = await db
    .select({ focus_id: activities.focus_id, secondary_focus_id: activities.secondary_focus_id })
    .from(activities)
    .where(eq(activities.id, activityId));
  if (!current) return 'Atividade não encontrada';
  const main = field === 'focus_id' ? value : current.focus_id;
  const secondary = field === 'secondary_focus_id' ? value : current.secondary_focus_id;
  return main && secondary && main === secondary ? 'O foco secundário tem de ser diferente do foco principal' : null;
}

/** The name of the format or focus a value suggestion points at, for the admin queue. */
export async function describeValueSuggestion(field: ValueField, value: string): Promise<string | null> {
  if (!UUID_RE.test(value)) return null;
  if (field === 'format_id') {
    const [row] = await db.select({ name: activityFormats.name }).from(activityFormats).where(eq(activityFormats.id, value));
    return row?.name ?? null;
  }
  const [row] = await db.select({ name: activityFocuses.name }).from(activityFocuses).where(eq(activityFocuses.id, value));
  return row?.name ?? null;
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
    } else {
      await tx.delete(activityAgeGroups).where(eq(activityAgeGroups.activity_id, activityId));
      await tx.insert(activityAgeGroups).values(
        values.map((age_group) => ({ activity_id: activityId, age_group: age_group as (typeof AGE_GROUP_VALUES)[number] }))
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
