import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { MEDIA_PATH_PREFIX, STORED_IMAGE_NAME } from '@/lib/storage/image-type';
import {
  activities,
  activityEducationalGoals,
  activitySdgs,
  activityGroupSizes,
  activityLocations,
  activityAgeGroups,
  activityFocuses,
  activityFormats,
  activityChallenges,
  activitySources,
  challenges,
  educationalGoalAgeGroups,
  educationalGoals,
  programEntries,
} from '../../../drizzle/schema';
import {
  AGE_GROUP_VALUES,
  GROUP_SIZE_VALUES,
  LOCATION_VALUES,
  RISK_LEVEL_VALUES,
  type AgeGroupValue,
  type GroupSizeValue,
  type LocationValue,
  type RiskLevelValue,
} from './category-values';
import { parseDurationRange } from './duration-range';

type Db = typeof db;
// A transaction exposes the same query API as the db handle.
type Executor = Pick<Db, 'insert' | 'delete' | 'select' | 'update'>;

export const ACTIVITY_FIELDS = [
  'name',
  'description',
  'materials',
  'instructions',
  'approximate_duration_minutes',
  'group_sizes',
  'effort_level',
  'locations',
  'age_groups',
  'format_id',
  'focus_id',
  'secondary_focus_id',
  'duration_min_minutes',
  'duration_max_minutes',
] as const;

export const INSTRUCTIONS_MAX_LENGTH = 5000;
export const RISK_TEXT_MAX_LENGTH = 2000;
export const BEHAVIOUR_MAX_LENGTH = 1000;
export const JUSTIFICATION_MAX_LENGTH = 1000;

/** One objective of an activity for one division, with how to observe it. */
export type ObjectiveRow = {
  goal_id: string;
  age_group: AgeGroupValue;
  behaviour: string | null;
};

export type SdgRow = { sdg_id: string; justification: string | null };

export type ActivityWrite = {
  name: string;
  description: string;
  materials: string;
  instructions: string | null;
  approximate_duration_minutes: number;
  group_sizes: GroupSizeValue[];
  effort_level: 'low' | 'medium' | 'high';
  locations: LocationValue[];
  age_groups: AgeGroupValue[];
  /** Format (what kind of activity), main focus and optional secondary focus (reference sheet). */
  format_id: string;
  focus_id: string;
  secondary_focus_id?: string | null;
  /** Optional range; the single duration above is what programs use. */
  duration_min_minutes?: number | null;
  duration_max_minutes?: number | null;
  /** Id in the reference sheet (ATV-0001). Set by the snapshot loader only, never accepted from a request body. */
  external_id?: string | null;
  /** Hash of the loaded content (snapshot loader only). */
  external_hash?: string | null;
  image_url?: string | null;
  physical_risk_level?: RiskLevelValue | null;
  physical_risk?: string | null;
  physical_mitigation?: string | null;
  psychological_risk_level?: RiskLevelValue | null;
  psychological_risk?: string | null;
  psychological_mitigation?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  /** Explicit per-division rows. When absent, `educational_goal_ids` is expanded instead. */
  objectives?: ObjectiveRow[];
  educational_goal_ids?: string[];
  /** Always set by the parser (from `sdgs`, or from the `sdg_ids` shorthand). */
  sdgs?: SdgRow[];
  sdg_ids?: string[];
  challenge_ids?: string[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Dedupes a list of enum strings; returns an error message when empty or invalid. */
function parseEnumList<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  label: string
): T[] | string {
  if (!Array.isArray(raw) || raw.length === 0) {
    return 'Indique pelo menos um valor para ' + label;
  }
  const values: T[] = [];
  for (const item of raw) {
    if (typeof item !== 'string' || !(allowed as readonly string[]).includes(item)) {
      return 'Valor inválido para ' + label;
    }
    if (!values.includes(item as T)) values.push(item as T);
  }
  return values;
}

export function parseActivityWrite(body: Record<string, unknown>): ActivityWrite | string {
  if (!body['name'] || !body['description'] || !body['materials']) {
    return 'Nome, descrição e materiais são obrigatórios';
  }
  const groupSizes = parseEnumList(body['group_sizes'], GROUP_SIZE_VALUES, 'tamanho do grupo');
  if (typeof groupSizes === 'string') return groupSizes;
  const locations = parseEnumList(body['locations'], LOCATION_VALUES, 'local');
  if (typeof locations === 'string') return locations;
  const ageGroups = parseEnumList(body['age_groups'], AGE_GROUP_VALUES, 'secção');
  if (typeof ageGroups === 'string') return ageGroups;
  const rawFormat = body['format_id'];
  if (typeof rawFormat !== 'string' || !rawFormat) return 'Indique o formato da atividade';
  if (!UUID_RE.test(rawFormat)) return 'Formato inválido';
  const rawFocus = body['focus_id'];
  if (typeof rawFocus !== 'string' || !rawFocus) return 'Indique o foco principal da atividade';
  if (!UUID_RE.test(rawFocus)) return 'Foco principal inválido';
  const rawSecondary = body['secondary_focus_id'];
  let secondaryFocus: string | null = null;
  if (rawSecondary !== undefined && rawSecondary !== null && rawSecondary !== '') {
    if (typeof rawSecondary !== 'string' || !UUID_RE.test(rawSecondary)) return 'Foco secundário inválido';
    if (rawSecondary === rawFocus) return 'O foco secundário tem de ser diferente do foco principal';
    secondaryFocus = rawSecondary;
  }
  const instructionsRaw = typeof body['instructions'] === 'string' ? body['instructions'].trim() : '';
  if (instructionsRaw.length > INSTRUCTIONS_MAX_LENGTH) {
    return `As instruções não podem exceder ${INSTRUCTIONS_MAX_LENGTH} caracteres`;
  }
  const duration = Number(body['approximate_duration_minutes']);
  if (!Number.isFinite(duration) || duration < 1) {
    return 'Duração inválida';
  }
  const range = parseDurationRange(body['duration_min_minutes'], body['duration_max_minutes']);
  if (typeof range === 'string') return range;
  const imageValue = typeof body['image_url'] === 'string' ? body['image_url'].trim() : '';
  const isStoredImage =
    imageValue.startsWith(MEDIA_PATH_PREFIX) && STORED_IMAGE_NAME.test(imageValue.slice(MEDIA_PATH_PREFIX.length));
  if (imageValue && !isStoredImage) {
    try {
      const imageUrl = new URL(imageValue);
      if (imageUrl.protocol !== 'https:') {
        return 'A imagem deve usar um URL HTTPS';
      }
    } catch {
      return 'A imagem deve usar um URL HTTPS';
    }
  }
  const extras = parseActivityExtras(body, ageGroups);
  if (typeof extras === 'string') return extras;
  return {
    ...extras,
    name: String(body['name']),
    description: String(body['description']),
    materials: String(body['materials']),
    instructions: instructionsRaw || null,
    approximate_duration_minutes: duration,
    group_sizes: groupSizes,
    effort_level: body['effort_level'] as ActivityWrite['effort_level'],
    locations,
    age_groups: ageGroups,
    format_id: rawFormat,
    focus_id: rawFocus,
    secondary_focus_id: secondaryFocus,
    duration_min_minutes: range.min,
    duration_max_minutes: range.max,
    image_url: typeof body['image_url'] === 'string' ? body['image_url'] : null,
    educational_goal_ids: Array.isArray(body['educational_goal_ids'])
      ? body['educational_goal_ids'].map(String)
      : [],
    sdg_ids: Array.isArray(body['sdg_ids']) ? body['sdg_ids'].map(String) : [],
  };
}

function optionalText(raw: unknown, max: number, label: string): string | null | { error: string } {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') return { error: `${label} inválido` };
  const text = raw.trim();
  if (text.length > max) return { error: `${label} não pode exceder ${max} caracteres` };
  return text || null;
}

function parseRiskLevel(raw: unknown, label: string): RiskLevelValue | null | { error: string } {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'string' && (RISK_LEVEL_VALUES as readonly string[]).includes(raw)) {
    return raw as RiskLevelValue;
  }
  return { error: `Nível de risco inválido (${label})` };
}

/** Risk analysis, source, objectives per division, SDGs with justification and desafios. */
function parseActivityExtras(
  body: Record<string, unknown>,
  ageGroups: readonly AgeGroupValue[]
): Partial<ActivityWrite> | string {
  const out: Partial<ActivityWrite> = {};

  const levels = [
    ['physical_risk_level', 'físico'],
    ['psychological_risk_level', 'psicológico'],
  ] as const;
  for (const [key, label] of levels) {
    const level = parseRiskLevel(body[key], label);
    if (level && typeof level === 'object') return level.error;
    out[key] = level;
  }
  const texts = [
    ['physical_risk', 'O risco físico'],
    ['physical_mitigation', 'A mitigação física'],
    ['psychological_risk', 'O risco psicológico'],
    ['psychological_mitigation', 'A mitigação psicológica'],
  ] as const;
  for (const [key, label] of texts) {
    const text = optionalText(body[key], RISK_TEXT_MAX_LENGTH, label);
    if (text && typeof text === 'object') return text.error;
    out[key] = text;
  }

  if (body['source_id'] !== undefined && body['source_id'] !== null && body['source_id'] !== '') {
    if (typeof body['source_id'] !== 'string' || !UUID_RE.test(body['source_id'])) return 'Fonte inválida';
    out.source_id = body['source_id'];
  } else {
    out.source_id = null;
  }
  if (typeof body['source_url'] === 'string' && body['source_url'].trim()) {
    try {
      if (new URL(body['source_url']).protocol !== 'https:') return 'A ligação à fonte deve usar HTTPS';
    } catch {
      return 'A ligação à fonte deve usar HTTPS';
    }
    out.source_url = body['source_url'].trim();
  } else {
    out.source_url = null;
  }

  if (body['objectives'] !== undefined) {
    if (!Array.isArray(body['objectives'])) return 'Objetivos inválidos';
    const rows: ObjectiveRow[] = [];
    for (const raw of body['objectives'] as unknown[]) {
      const item = raw as Record<string, unknown> | null;
      if (!item || typeof item !== 'object') return 'Objetivos inválidos';
      const goalId = item['goal_id'];
      const ageGroup = item['age_group'];
      if (typeof goalId !== 'string' || !UUID_RE.test(goalId)) return 'Objetivo educativo inválido';
      if (typeof ageGroup !== 'string' || !(AGE_GROUP_VALUES as readonly string[]).includes(ageGroup)) {
        return 'Divisão inválida num objetivo';
      }
      if (!ageGroups.includes(ageGroup as AgeGroupValue)) {
        return `A divisão ${ageGroup} não é uma das divisões da atividade`;
      }
      const behaviour = optionalText(item['behaviour'], BEHAVIOUR_MAX_LENGTH, 'O comportamento a observar');
      if (behaviour && typeof behaviour === 'object') return behaviour.error;
      if (!rows.some((row) => row.goal_id === goalId && row.age_group === ageGroup)) {
        rows.push({ goal_id: goalId, age_group: ageGroup as AgeGroupValue, behaviour });
      }
    }
    out.objectives = rows;
  }

  const sdgRows: SdgRow[] = [];
  if (Array.isArray(body['sdgs'])) {
    for (const raw of body['sdgs'] as unknown[]) {
      const item = raw as Record<string, unknown> | null;
      if (!item || typeof item !== 'object' || typeof item['sdg_id'] !== 'string') return 'ODS inválido';
      const justification = optionalText(item['justification'], JUSTIFICATION_MAX_LENGTH, 'A justificação');
      if (justification && typeof justification === 'object') return justification.error;
      if (!sdgRows.some((row) => row.sdg_id === item['sdg_id'])) {
        sdgRows.push({ sdg_id: item['sdg_id'], justification });
      }
    }
  } else if (Array.isArray(body['sdg_ids'])) {
    for (const id of body['sdg_ids'].map(String)) {
      if (!sdgRows.some((row) => row.sdg_id === id)) sdgRows.push({ sdg_id: id, justification: null });
    }
  }
  out.sdgs = sdgRows;

  if (body['challenge_ids'] !== undefined) {
    if (!Array.isArray(body['challenge_ids']) || !body['challenge_ids'].every((id) => typeof id === 'string' && UUID_RE.test(id))) {
      return 'Desafio inválido';
    }
    out.challenge_ids = [...new Set(body['challenge_ids'] as string[])];
  } else {
    out.challenge_ids = [];
  }
  return out;
}

/** Returns an error message when the format or a focus does not exist, else null. */
export async function verifyFormatAndFocus(data: ActivityWrite): Promise<string | null> {
  const [format] = await db.select({ id: activityFormats.id }).from(activityFormats).where(eq(activityFormats.id, data.format_id));
  if (!format) return 'Formato inválido';
  const focusIds = [data.focus_id, ...(data.secondary_focus_id ? [data.secondary_focus_id] : [])];
  const found = await db.select({ id: activityFocuses.id }).from(activityFocuses).where(inArray(activityFocuses.id, focusIds));
  return found.length === focusIds.length ? null : 'Foco inválido';
}

/**
 * The objective rows an activity will store: the explicit `objectives`, or, for the old
 * `educational_goal_ids` shorthand, one row per division the objective shares with the activity.
 */
export async function resolveObjectiveRows(data: ActivityWrite, executor: Executor = db): Promise<ObjectiveRow[]> {
  if (data.objectives) return data.objectives;
  const goalIds = [...new Set(data.educational_goal_ids ?? [])];
  if (goalIds.length === 0) return [];
  const links = await executor
    .select({ goal_id: educationalGoalAgeGroups.goal_id, age_group: educationalGoalAgeGroups.age_group })
    .from(educationalGoalAgeGroups)
    .where(inArray(educationalGoalAgeGroups.goal_id, goalIds));
  const rows: ObjectiveRow[] = [];
  for (const goalId of goalIds) {
    const own = links.filter((link) => link.goal_id === goalId).map((link) => link.age_group);
    const shared = data.age_groups.filter((group) => own.includes(group));
    for (const age_group of shared) rows.push({ goal_id: goalId, age_group, behaviour: null });
    if (shared.length === 0) {
      // Linked to no shared division: it is reported by verifyActivityGoals, never stored.
      rows.push({ goal_id: goalId, age_group: data.age_groups[0]!, behaviour: null });
    }
  }
  return rows;
}


/**
 * A row's objective must belong to the row's division. The Matriz has no objectives for
 * Dirigentes (`leaders`), so no objective ever belongs to that division: an activity can be
 * suitable for Dirigentes, but it cannot carry objectives for them.
 */
export function objectiveMatchesRow(
  row: ObjectiveRow,
  belongs: (goalId: string, group: AgeGroupValue) => boolean
): boolean {
  return belongs(row.goal_id, row.age_group);
}

/**
 * Returns an error message when a linked objective is unknown or does not belong to the
 * division of its row, else null. Objectives without age groups (legacy admin-created ones)
 * never match, so they cannot be newly linked until an admin gives them age groups.
 */
export async function verifyActivityGoals(data: ActivityWrite): Promise<string | null> {
  const rows = await resolveObjectiveRows(data);
  const goalIds = [...new Set(rows.map((row) => row.goal_id))];
  if (goalIds.length === 0) return null;

  const goals = await db
    .select({ id: educationalGoals.id, code: educationalGoals.code })
    .from(educationalGoals)
    .where(inArray(educationalGoals.id, goalIds));
  if (goals.length !== goalIds.length) return 'Objetivo educativo inválido';

  const links = await db
    .select({ goal_id: educationalGoalAgeGroups.goal_id, age_group: educationalGoalAgeGroups.age_group })
    .from(educationalGoalAgeGroups)
    .where(inArray(educationalGoalAgeGroups.goal_id, goalIds));
  const belongs = new Set(links.map((link) => `${link.goal_id}:${link.age_group}`));
  const mismatched = new Set<string>();
  for (const row of rows) {
    if (!objectiveMatchesRow(row, (goalId, group) => belongs.has(`${goalId}:${group}`))) {
      mismatched.add(goals.find((goal) => goal.id === row.goal_id)!.code);
    }
  }
  return mismatched.size === 0
    ? null
    : `Os objetivos educativos ${[...mismatched].sort().join(', ')} não pertencem às divisões da atividade`;
}

/** Returns an error message when a linked desafio or the source does not exist, else null. */
export async function verifyActivityExtras(data: ActivityWrite): Promise<string | null> {
  const challengeIds = data.challenge_ids ?? [];
  if (challengeIds.length > 0) {
    const found = await db.select({ id: challenges.id }).from(challenges).where(inArray(challenges.id, challengeIds));
    if (found.length !== challengeIds.length) return 'Desafio inválido';
  }
  if (data.source_id) {
    const [source] = await db.select({ id: activitySources.id }).from(activitySources).where(eq(activitySources.id, data.source_id));
    if (!source) return 'Fonte inválida';
  }
  return null;
}

export async function replaceRelations(
  activityId: string,
  data: ActivityWrite,
  executor: Executor = db
) {
  await executor.delete(activityEducationalGoals).where(eq(activityEducationalGoals.activity_id, activityId));
  await executor.delete(activitySdgs).where(eq(activitySdgs.activity_id, activityId));
  await executor.delete(activityGroupSizes).where(eq(activityGroupSizes.activity_id, activityId));
  await executor.delete(activityLocations).where(eq(activityLocations.activity_id, activityId));
  await executor.delete(activityAgeGroups).where(eq(activityAgeGroups.activity_id, activityId));
  await executor.insert(activityGroupSizes).values(
    data.group_sizes.map((group_size) => ({ activity_id: activityId, group_size }))
  );
  await executor.insert(activityLocations).values(
    data.locations.map((location) => ({ activity_id: activityId, location }))
  );
  await executor.insert(activityAgeGroups).values(
    data.age_groups.map((age_group) => ({ activity_id: activityId, age_group }))
  );
  const objectiveRows = await resolveObjectiveRows(data, executor);
  if (objectiveRows.length > 0) {
    await executor.insert(activityEducationalGoals).values(
      objectiveRows.map((row) => ({
        activity_id: activityId,
        goal_id: row.goal_id,
        age_group: row.age_group,
        observable_behaviour: row.behaviour,
      }))
    );
  }
  if (data.sdgs?.length) {
    await executor.insert(activitySdgs).values(
      data.sdgs.map((row) => ({ activity_id: activityId, sdg_id: row.sdg_id, justification: row.justification }))
    );
  }
  await executor.delete(activityChallenges).where(eq(activityChallenges.activity_id, activityId));
  if (data.challenge_ids?.length) {
    await executor.insert(activityChallenges).values(
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
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(activities)
      .values({
        name: data.name,
        description: data.description,
        materials: data.materials,
        instructions: data.instructions,
        approximate_duration_minutes: data.approximate_duration_minutes,
        duration_min_minutes: data.duration_min_minutes ?? null,
        duration_max_minutes: data.duration_max_minutes ?? null,
        external_id: data.external_id ?? null,
        external_hash: data.external_hash ?? null,
        format_id: data.format_id,
        focus_id: data.focus_id,
        secondary_focus_id: data.secondary_focus_id ?? null,
        effort_level: data.effort_level,
        image_url: data.image_url,
        physical_risk_level: data.physical_risk_level ?? null,
        physical_risk: data.physical_risk ?? null,
        physical_mitigation: data.physical_mitigation ?? null,
        psychological_risk_level: data.psychological_risk_level ?? null,
        psychological_risk: data.psychological_risk ?? null,
        psychological_mitigation: data.psychological_mitigation ?? null,
        source_id: data.source_id ?? null,
        source_url: data.source_url ?? null,
        created_by: options.createdBy ?? null,
        is_approved: options.isApproved,
      })
      .returning();
    await replaceRelations(row.id, data, tx);
    return row;
  });
}

/** Updates the activity and replaces all its relations in one transaction. */
export async function updateActivity(activityId: string, data: ActivityWrite) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(activities)
      .set({
        name: data.name,
        description: data.description,
        materials: data.materials,
        instructions: data.instructions,
        approximate_duration_minutes: data.approximate_duration_minutes,
        duration_min_minutes: data.duration_min_minutes ?? null,
        duration_max_minutes: data.duration_max_minutes ?? null,
        format_id: data.format_id,
        focus_id: data.focus_id,
        secondary_focus_id: data.secondary_focus_id ?? null,
        ...(data.external_hash !== undefined ? { external_hash: data.external_hash } : {}),
        effort_level: data.effort_level,
        image_url: data.image_url,
        physical_risk_level: data.physical_risk_level ?? null,
        physical_risk: data.physical_risk ?? null,
        physical_mitigation: data.physical_mitigation ?? null,
        psychological_risk_level: data.psychological_risk_level ?? null,
        psychological_risk: data.psychological_risk ?? null,
        psychological_mitigation: data.psychological_mitigation ?? null,
        source_id: data.source_id ?? null,
        source_url: data.source_url ?? null,
        updated_at: new Date(),
      })
      .where(eq(activities.id, activityId))
      .returning();
    if (!row) return undefined;
    await replaceRelations(activityId, data, tx);
    return row;
  });
}
