import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  activityEducationalGoals,
  activitySdgs,
  activityChallenges,
  programEntries,
} from '../../../drizzle/schema';
import { challenges } from '../../../drizzle/schema/taxonomies';

export const ACTIVITY_FIELDS = [
  'name',
  'description',
  'materials',
  'approximate_duration_minutes',
  'group_size',
  'effort_level',
  'location',
  'age_group',
  'activity_type_id',
] as const;

export type ActivityWrite = {
  name: string;
  description: string;
  materials: string;
  approximate_duration_minutes: number;
  group_size: 'small' | 'medium' | 'large';
  effort_level: 'low' | 'medium' | 'high';
  location: 'inside' | 'outside';
  age_group: 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders';
  activity_type_id: string;
  image_url?: string | null;
  educational_goal_ids?: string[];
  sdg_ids?: string[];
  challenge_ids?: string[];
};

export function parseActivityWrite(body: Record<string, unknown>): ActivityWrite | string {
  if (!body['name'] || !body['description'] || !body['materials'] || !body['activity_type_id']) {
    return 'Nome, descrição, materiais e tipo são obrigatórios';
  }
  const duration = Number(body['approximate_duration_minutes']);
  if (!Number.isFinite(duration) || duration < 1) {
    return 'Duração inválida';
  }
  if (typeof body['image_url'] === 'string' && body['image_url'].trim()) {
    try {
      const imageUrl = new URL(body['image_url']);
      if (imageUrl.protocol !== 'https:') {
        return 'A imagem deve usar um URL HTTPS';
      }
    } catch {
      return 'A imagem deve usar um URL HTTPS';
    }
  }
  return {
    name: String(body['name']),
    description: String(body['description']),
    materials: String(body['materials']),
    approximate_duration_minutes: duration,
    group_size: body['group_size'] as ActivityWrite['group_size'],
    effort_level: body['effort_level'] as ActivityWrite['effort_level'],
    location: body['location'] as ActivityWrite['location'],
    age_group: body['age_group'] as ActivityWrite['age_group'],
    activity_type_id: String(body['activity_type_id']),
    image_url: typeof body['image_url'] === 'string' ? body['image_url'] : null,
    educational_goal_ids: Array.isArray(body['educational_goal_ids'])
      ? body['educational_goal_ids'].map(String)
      : [],
    sdg_ids: Array.isArray(body['sdg_ids']) ? body['sdg_ids'].map(String) : [],
    challenge_ids: Array.isArray(body['challenge_ids']) ? body['challenge_ids'].map(String) : [],
  };
}

export async function validateChallengeIds(ids: string[]): Promise<string | null> {
  if (!ids.length) return null;
  const unique = [...new Set(ids)];
  const rows = await db.select({ id: challenges.id }).from(challenges).where(inArray(challenges.id, unique));
  if (rows.length !== unique.length) {
    return 'Desafio inválido';
  }
  return null;
}

export async function replaceRelations(activityId: string, data: ActivityWrite) {
  await db.delete(activityEducationalGoals).where(eq(activityEducationalGoals.activity_id, activityId));
  await db.delete(activitySdgs).where(eq(activitySdgs.activity_id, activityId));
  await db.delete(activityChallenges).where(eq(activityChallenges.activity_id, activityId));
  if (data.educational_goal_ids?.length) {
    await db.insert(activityEducationalGoals).values(
      data.educational_goal_ids.map((goal_id) => ({ activity_id: activityId, goal_id }))
    );
  }
  if (data.sdg_ids?.length) {
    await db.insert(activitySdgs).values(
      data.sdg_ids.map((sdg_id) => ({ activity_id: activityId, sdg_id }))
    );
  }
  if (data.challenge_ids?.length) {
    await db.insert(activityChallenges).values(
      data.challenge_ids.map((challenge_id) => ({ activity_id: activityId, challenge_id }))
    );
  }
}

export async function activityIsReferenced(activityId: string) {
  const [row] = await db
    .select({ id: programEntries.id })
    .from(programEntries)
    .where(eq(programEntries.activity_id, activityId))
    .limit(1);
  return Boolean(row);
}

export async function createActivity(
  data: ActivityWrite,
  options: { createdBy?: string | null; isApproved: boolean }
) {
  const [row] = await db
    .insert(activities)
    .values({
      name: data.name,
      description: data.description,
      materials: data.materials,
      approximate_duration_minutes: data.approximate_duration_minutes,
      group_size: data.group_size,
      effort_level: data.effort_level,
      location: data.location,
      age_group: data.age_group,
      activity_type_id: data.activity_type_id,
      image_url: data.image_url,
      created_by: options.createdBy ?? null,
      is_approved: options.isApproved,
    })
    .returning();
  await replaceRelations(row.id, data);
  return row;
}
