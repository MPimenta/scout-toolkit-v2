import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activityTypes, educationalAreas, educationalGoals, sdgs, activities, activityEducationalGoals, activitySdgs } from '../../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

const TABLES = {
  'activity-types': activityTypes,
  'educational-areas': educationalAreas,
  'educational-goals': educationalGoals,
  sdgs,
} as const;

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
  const body = await request.json();
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
  const body = await request.json();
  const id = body.id as string;
  if (!id) return apiErrors.validation('id', 'ID obrigatório');
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

  if (kind === 'activity-types') {
    const [used] = await db.select({ id: activities.id }).from(activities).where(eq(activities.activity_type_id, id)).limit(1);
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
