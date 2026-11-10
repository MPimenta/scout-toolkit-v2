import { NextRequest, NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/server';
import {
  activities,
  activityFocuses,
  activityFormats,
  activityTypes,
  educationalAreas,
  educationalGoals,
  educationalGoalAgeGroups,
  generalObjectives,
  sdgs,
  activityActivityTypes,
  activityEducationalGoals,
  activitySdgs,
} from '../../../../../../drizzle/schema';
import { AGE_GROUP_VALUES } from '../../../../../../drizzle/schema/category-values';
import { requireAdminApi } from '@/lib/auth/utils';
import { slugCode } from '@/lib/reference-data/slug-code';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

const TABLES = {
  'activity-types': activityTypes,
  'activity-formats': activityFormats,
  'activity-focuses': activityFocuses,
  'educational-areas': educationalAreas,
  'educational-goals': educationalGoals,
  'general-objectives': generalObjectives,
  sdgs,
} as const;

/** Tables whose rows the Matriz loader may own (is_managed): read-only for admins. */
const MANAGED_KINDS = new Set<string>(['educational-areas', 'educational-goals', 'general-objectives', 'activity-formats', 'activity-focuses']);
const MANAGED_MESSAGE = 'Este registo é gerido pela Matriz Progresso Pessoal e não pode ser alterado';
const SHEET_MANAGED_MESSAGE = 'Este valor vem da folha de referência e não pode ser alterado';
const managedMessage = (kind: string) => (kind === 'activity-formats' || kind === 'activity-focuses' ? SHEET_MANAGED_MESSAGE : MANAGED_MESSAGE);

/** A format or focus an admin adds: the code is derived from the name and the loader flag is never set. */
const valueBody = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(80, 'Nome demasiado longo'),
  description: z.string().trim().max(300, 'Descrição demasiado longa').nullish(),
  position: z.number().int().min(0).optional(),
});

const goalBody = z.object({
  area_id: z.string().uuid(),
  general_objective_id: z.string().uuid(),
  title: z.string().trim().min(1, 'Título obrigatório'),
  description: z.string().nullish(),
  code: z.string().trim().min(1, 'Código obrigatório'),
  icon: z.string().optional(),
  age_groups: z.array(z.enum(AGE_GROUP_VALUES)).min(1, 'Escolha pelo menos uma divisão'),
});

const generalObjectiveBody = z.object({
  area_id: z.string().uuid(),
  path_id: z.string().uuid().nullish(),
  code: z.string().trim().min(1, 'Código obrigatório'),
  title: z.string().trim().min(1, 'Título obrigatório'),
});

/** The loader's flag is never taken from a request body. */
function withoutManagedFlag(body: Record<string, unknown>): Record<string, unknown> {
  const { is_managed: _ignored, ...rest } = body;
  return rest;
}

async function isManaged(kind: string, id: string): Promise<boolean> {
  if (kind === 'activity-formats') {
    const [row] = await db.select({ m: activityFormats.is_managed }).from(activityFormats).where(eq(activityFormats.id, id));
    return Boolean(row?.m);
  }
  if (kind === 'activity-focuses') {
    const [row] = await db.select({ m: activityFocuses.is_managed }).from(activityFocuses).where(eq(activityFocuses.id, id));
    return Boolean(row?.m);
  }
  if (kind === 'educational-areas') {
    const [row] = await db.select({ m: educationalAreas.is_managed }).from(educationalAreas).where(eq(educationalAreas.id, id));
    return Boolean(row?.m);
  }
  if (kind === 'educational-goals') {
    const [row] = await db.select({ m: educationalGoals.is_managed }).from(educationalGoals).where(eq(educationalGoals.id, id));
    return Boolean(row?.m);
  }
  if (kind === 'general-objectives') {
    const [row] = await db.select({ m: generalObjectives.is_managed }).from(generalObjectives).where(eq(generalObjectives.id, id));
    return Boolean(row?.m);
  }
  return false;
}

/** A goal's area must equal the area of its general objective. Returns an error message or null. */
async function checkGoalArea(areaId: string, generalObjectiveId: string): Promise<string | null> {
  const [general] = await db
    .select({ area_id: generalObjectives.area_id })
    .from(generalObjectives)
    .where(eq(generalObjectives.id, generalObjectiveId));
  if (!general) return 'Objetivo geral inexistente';
  return general.area_id === areaId ? null : 'A área do objetivo tem de ser a do objetivo geral';
}

type Kind = keyof typeof TABLES;

function tableFor(kind: string) {
  return TABLES[kind as Kind];
}

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;
  const { kind } = await params;
  const table = tableFor(kind);
  if (!table) return apiErrors.notFound('taxonomia', kind);
  const body = withoutManagedFlag(await request.json());

  if (kind === 'educational-goals') {
    const parsed = goalBody.safeParse(body);
    if (!parsed.success) return apiErrors.validation('body', parsed.error.issues[0]?.message ?? 'Dados inválidos');
    const areaError = await checkGoalArea(parsed.data.area_id, parsed.data.general_objective_id);
    if (areaError) return apiErrors.validation('area_id', areaError);
    try {
      const { age_groups, ...goal } = parsed.data;
      const item = await db.transaction(async (tx) => {
        const [row] = await tx.insert(educationalGoals).values({ ...goal, is_managed: false }).returning();
        await tx.insert(educationalGoalAgeGroups).values(age_groups.map((age_group) => ({ goal_id: row!.id, age_group })));
        return { ...row!, age_groups };
      });
      return NextResponse.json({ item }, { status: 201 });
    } catch {
      return apiErrors.conflict('Não foi possível criar (código duplicado)');
    }
  }
  if (kind === 'general-objectives') {
    const parsed = generalObjectiveBody.safeParse(body);
    if (!parsed.success) return apiErrors.validation('body', parsed.error.issues[0]?.message ?? 'Dados inválidos');
    try {
      const [row] = await db.insert(generalObjectives).values({ ...parsed.data, is_managed: false }).returning();
      return NextResponse.json({ item: row }, { status: 201 });
    } catch {
      return apiErrors.conflict('Não foi possível criar (código duplicado)');
    }
  }

  if (kind === 'activity-formats' || kind === 'activity-focuses') {
    const parsed = valueBody.safeParse(body);
    if (!parsed.success) return apiErrors.validation('body', parsed.error.issues[0]?.message ?? 'Dados inválidos');
    const code = slugCode(parsed.data.name);
    if (!code) return apiErrors.validation('name', 'Nome inválido');
    const values = { ...parsed.data, code, description: parsed.data.description ?? null, position: parsed.data.position ?? 1000, is_managed: false };
    try {
      const [row] = await db.insert(kind === 'activity-formats' ? activityFormats : activityFocuses).values(values).returning();
      return NextResponse.json({ item: row }, { status: 201 });
    } catch {
      return apiErrors.conflict('Já existe um valor com este nome');
    }
  }

  try {
    const [row] = await db.insert(table).values(body).returning();
    return NextResponse.json({ item: row }, { status: 201 });
  } catch {
    return apiErrors.conflict('Não foi possível criar (código ou número duplicado)');
  }
});

export const PATCH = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;
  const { kind } = await params;
  const table = tableFor(kind);
  if (!table) return apiErrors.notFound('taxonomia', kind);
  const body = withoutManagedFlag(await request.json());
  const id = body.id as string;
  if (!id) return apiErrors.validation('id', 'ID obrigatório');
  if (MANAGED_KINDS.has(kind) && (await isManaged(kind, id))) return apiErrors.conflict(managedMessage(kind));

  if (kind === 'activity-formats' || kind === 'activity-focuses') {
    // Only the wording of an admin's own value can change; the code and the loader flag never do.
    const parsed = valueBody.partial().safeParse(body);
    if (!parsed.success) return apiErrors.validation('body', parsed.error.issues[0]?.message ?? 'Dados inválidos');
    const target = kind === 'activity-formats' ? activityFormats : activityFocuses;
    const [row] = await db.update(target).set(parsed.data).where(eq(target.id, id)).returning();
    return row ? NextResponse.json({ item: row }) : apiErrors.notFound('valor', id);
  }

  if (kind === 'educational-goals' && ('age_groups' in body || 'general_objective_id' in body || 'area_id' in body)) {
    const [current] = await db.select().from(educationalGoals).where(eq(educationalGoals.id, id));
    if (!current) return apiErrors.notFound('objetivo', id);
    const areaId = (body.area_id as string | undefined) ?? current.area_id;
    const generalId = (body.general_objective_id as string | undefined) ?? current.general_objective_id;
    if (!generalId) return apiErrors.validation('general_objective_id', 'Objetivo geral obrigatório');
    const areaError = await checkGoalArea(areaId, generalId);
    if (areaError) return apiErrors.validation('area_id', areaError);
    const ageGroups = body.age_groups === undefined ? undefined : z.array(z.enum(AGE_GROUP_VALUES)).min(1).safeParse(body.age_groups);
    if (ageGroups && !ageGroups.success) return apiErrors.validation('age_groups', 'Escolha pelo menos uma divisão');
    const { age_groups: _ages, ...fields } = body;
    const item = await db.transaction(async (tx) => {
      const [row] = await tx.update(educationalGoals).set(fields).where(eq(educationalGoals.id, id)).returning();
      if (ageGroups?.success) {
        await tx.delete(educationalGoalAgeGroups).where(eq(educationalGoalAgeGroups.goal_id, id));
        await tx.insert(educationalGoalAgeGroups).values(ageGroups.data.map((age_group) => ({ goal_id: id, age_group })));
      }
      return row;
    });
    return NextResponse.json({ item });
  }

  const [row] = await db.update(table).set(body).where(eq(table.id, id)).returning();
  return NextResponse.json({ item: row });
});

export const DELETE = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;
  const { kind } = await params;
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiErrors.validation('id', 'ID obrigatório');

  if (MANAGED_KINDS.has(kind) && (await isManaged(kind, id))) return apiErrors.conflict(managedMessage(kind));
  if (kind === 'activity-formats') {
    const [used] = await db.select({ id: activities.id }).from(activities).where(eq(activities.format_id, id)).limit(1);
    if (used) return apiErrors.conflict('Formato ainda usado por atividades');
  }
  if (kind === 'activity-focuses') {
    const [used] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(or(eq(activities.focus_id, id), eq(activities.secondary_focus_id, id)))
      .limit(1);
    if (used) return apiErrors.conflict('Foco ainda usado por atividades');
  }
  if (kind === 'general-objectives') {
    const [child] = await db
      .select({ id: educationalGoals.id })
      .from(educationalGoals)
      .where(and(eq(educationalGoals.general_objective_id, id)))
      .limit(1);
    if (child) return apiErrors.conflict('Objetivo geral ainda tem objetivos específicos');
  }
  if (kind === 'activity-types') {
    const [used] = await db.select({ id: activityActivityTypes.activity_id }).from(activityActivityTypes).where(eq(activityActivityTypes.activity_type_id, id)).limit(1);
    if (used) return apiErrors.conflict('Tipo ainda usado por atividades');
  }
  if (kind === 'educational-goals') {
    const [used] = await db.select({ activity_id: activityEducationalGoals.activity_id }).from(activityEducationalGoals).where(eq(activityEducationalGoals.goal_id, id)).limit(1);
    if (used) return apiErrors.conflict('Objetivo ainda usado por atividades');
  }
  if (kind === 'sdgs') {
    const [used] = await db.select({ activity_id: activitySdgs.activity_id }).from(activitySdgs).where(eq(activitySdgs.sdg_id, id)).limit(1);
    if (used) return apiErrors.conflict('ODS ainda usado por atividades');
  }
  if (kind === 'educational-areas') {
    const goals = await db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.area_id, id));
    for (const goal of goals) {
      const [used] = await db.select({ activity_id: activityEducationalGoals.activity_id }).from(activityEducationalGoals).where(eq(activityEducationalGoals.goal_id, goal.id)).limit(1);
      if (used) return apiErrors.conflict('Área ainda tem objetivos usados por atividades');
    }
  }

  const table = tableFor(kind);
  if (!table) return apiErrors.notFound('taxonomia', kind);
  await db.delete(table).where(eq(table.id, id));
  return NextResponse.json({ success: true });
});
