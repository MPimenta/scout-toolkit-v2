import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { programs } from '../../../drizzle/schema';
import {
  E2E_STUB_UNITS,
  listLocalCenterMembers,
  type OrgoLocalUnit,
  type OrgoMember,
  type OrgoUnitOption,
} from './client';
import { isE2EOrgoStub, isOrgoWriteConfigured } from './config';
import { E2E_STUB_SCOPE, resolveLeaderScope, type LeaderScope } from './scope';
import { loadLeaderUnits } from './units';

/** Everything the Orgo routes need to know about the signed-in leader. */
export interface LeaderContext {
  scope: LeaderScope;
  units: OrgoUnitOption[];
  localUnits: OrgoLocalUnit[];
  groupName: string | null;
  stub: boolean;
}

const STUB_LOCAL_UNITS: OrgoLocalUnit[] = [
  { id: '9001', name: 'Alcateia', kind: 'divisao', parentId: null, userType: 'Lobito' },
  { id: '9002', name: 'Tribo de Exploradores', kind: 'divisao', parentId: null, userType: 'Explorador' },
  { id: '9003', name: 'Chefia', kind: 'divisao', parentId: null, userType: 'Dirigente' },
];

const STUB_MEMBERS: OrgoMember[] = [
  { id: '1001', name: 'Ana Exemplo', cardId: '10001', type: 'Lobito' },
  { id: '1002', name: 'Rui Teste', cardId: '10002', type: 'Lobito' },
  { id: '1003', name: 'Inês Modelo', cardId: '10003', type: 'Explorador' },
  { id: '1004', name: 'Tomás Amostra', cardId: '10004', type: 'Explorador' },
  { id: '1005', name: 'Marta Exemplo', cardId: '10005', type: 'Dirigente' },
];

/** Where the Orgo routes get their data from: the real Orgo, or the e2e stub. */
export function orgoMode(email: string | null | undefined): 'live' | 'stub' | 'off' {
  if (isOrgoWriteConfigured()) return 'live';
  return isE2EOrgoStub(email) ? 'stub' : 'off';
}

/**
 * The leader's scope and units, read from Orgo on every call. Returns null when the leader
 * may not create events (no event permission, inactive, or no local group).
 */
export async function loadLeaderContext(user: {
  id: string;
  email: string;
}): Promise<LeaderContext | null> {
  if (orgoMode(user.email) === 'stub') {
    return {
      scope: E2E_STUB_SCOPE,
      units: E2E_STUB_UNITS,
      localUnits: STUB_LOCAL_UNITS,
      groupName: 'Agrupamento 123',
      stub: true,
    };
  }
  const scope = await resolveLeaderScope(user.id);
  if (!scope) return null;
  const { units, localUnits, groupName } = await loadLeaderUnits(scope);
  return { scope, units, localUnits, groupName, stub: false };
}

/** Members of the leader's own local group, and only that group. */
export async function listMembersInScope(context: LeaderContext): Promise<OrgoMember[]> {
  if (context.stub) return STUB_MEMBERS;
  return listLocalCenterMembers(context.scope.localCenterId);
}

/** The program fields the Orgo routes need, for the owner only. */
export async function requireOwnedProgram(programId: string, userId: string) {
  const [program] = await db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      is_public: programs.is_public,
      user_id: programs.user_id,
      orgo_event_uuid: programs.orgo_event_uuid,
      orgo_event_url: programs.orgo_event_url,
      orgo_steps: programs.orgo_steps,
    })
    .from(programs)
    .where(eq(programs.id, programId));

  if (!program || program.user_id !== userId) return null;
  return program;
}
