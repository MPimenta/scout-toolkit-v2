import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activityTypes,
  educationalAreas,
  educationalGoals,
  challengeTypes,
  challenges,
  sdgs,
  activities,
  activityEducationalGoals,
  activitySdgs,
  activityChallenges,
} from '../../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

const TABLES = {
  'activity-types': activityTypes,
  'educational-areas': educationalAreas,
  'educational-goals': educationalGoals,
  'challenge-types': challengeTypes,
  challenges,
  sdgs,
} as const;

type Kind = keyof typeof TABLES;

function tableFor(kind: string) {
  return TABLES[kind as Kind];
}

function insertValues(kind: string, body: Record<string, unknown>) {
  if (kind === 'challenge-types') {
    return { name: String(body.name ?? '').trim() };
  }
  if (kind === 'challenges') {
    return {
      name: String(body.name ?? '').trim(),
      description: String(body.description ?? '').trim(),
      type_id: String(body.type_id ?? ''),
    };
  }
  return body;
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
  if (kind === 'challenge-types' && !String(body.name ?? '').trim()) {
    return apiErrors.validation('name', 'Nome obrigatório');
  }
  if (kind === 'challenges') {
    if (!String(body.name ?? '').trim() || !String(body.description ?? '').trim()) {
      return apiErrors.validation('body', 'Nome e descrição são obrigatórios');
    }
    const typeId = String(body.type_id ?? '');
    if (!typeId) return apiErrors.validation('type_id', 'Tipo de desafio obrigatório');
    const [type] = await db.select({ id: challengeTypes.id }).from(challengeTypes).where(eq(challengeTypes.id, typeId)).limit(1);
    if (!type) return apiErrors.validation('type_id', 'Tipo de desafio inválido');
  }
  try {
    const [row] = await db.insert(table).values(insertValues(kind, body) as never).returning();
    return NextResponse.json({ item: row }, { status: 201 });
  } catch {
    return apiErrors.conflict('Não foi possível criar (código, número ou nome duplicado)');
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
  if (kind === 'challenges') {
    const typeId = String(body.type_id ?? '');
    if (typeId) {
      const [type] = await db.select({ id: challengeTypes.id }).from(challengeTypes).where(eq(challengeTypes.id, typeId)).limit(1);
      if (!type) return apiErrors.validation('type_id', 'Tipo de desafio inválido');
    }
  }
  try {
    const [row] = await db.update(table).set(insertValues(kind, body) as never).where(eq(table.id, id)).returning();
    return NextResponse.json({ item: row });
  } catch {
    return apiErrors.conflict('Não foi possível atualizar (código, número ou nome duplicado)');
  }
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
  if (kind === 'challenges') {
    const [used] = await db.select({ activity_id: activityChallenges.activity_id }).from(activityChallenges).where(eq(activityChallenges.challenge_id, id)).limit(1);
    if (used) return apiErrors.conflict('Desafio ainda usado por atividades');
  }
  if (kind === 'challenge-types') {
    const typeChallenges = await db.select({ id: challenges.id }).from(challenges).where(eq(challenges.type_id, id));
    for (const challenge of typeChallenges) {
      const [used] = await db.select({ activity_id: activityChallenges.activity_id }).from(activityChallenges).where(eq(activityChallenges.challenge_id, challenge.id)).limit(1);
      if (used) return apiErrors.conflict('Tipo ainda tem desafios usados por atividades');
    }
  }

  const table = tableFor(kind);
  if (!table) return apiErrors.notFound('taxonomia', kind);
  await db.delete(table).where(eq(table.id, id));
  return NextResponse.json({ success: true });
});
