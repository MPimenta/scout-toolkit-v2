import { getOrgoApiToken, getOrgoIssuer, orgoEventUrl } from './config';
import type { OrgoEventPayload } from './map-event';

export type OrgoUnitOption = {
  iri: string;
  name: string;
};

type HydraCollection<T> = {
  'hydra:member'?: T[];
  member?: T[];
};

type OrgoUserRow = {
  id?: number | string;
  '@id'?: string;
  email?: string;
};

export type OrgoUserRoleRow = {
  unit?: string | { id?: number | string; name?: string; '@id'?: string };
  /** Orgo permission level for the unit, e.g. "EVENT_LOCAL" or "ADMIN_LOCAL"; "USER" is a plain member. */
  localCenterPermission?: string | null;
  isAdmin?: boolean | null;
  dateEnded?: string | null;
  [key: string]: unknown;
};

/** Permission prefixes that allow creating events in a unit. */
const EVENT_CREATE_PREFIXES = ['EVENT_', 'ADMIN_'];

function hydraMembers<T>(body: HydraCollection<T> | T[] | null | undefined): T[] {
  if (Array.isArray(body)) return body;
  if (!body) return [];
  return body['hydra:member'] ?? body.member ?? [];
}

export async function orgoFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getOrgoApiToken();
  if (!token) {
    throw new Error('ORGO_API_TOKEN missing');
  }
  const url = path.startsWith('http') ? path : `${getOrgoIssuer()}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/ld+json, application/json',
      'Content-Type': 'application/json',
      'Api-Token': token,
      ...init.headers,
    },
  });
}

function unitFromRole(role: OrgoUserRoleRow): OrgoUnitOption | null {
  if (role.dateEnded) return null;
  const unit = role.unit;
  if (!unit) return null;
  if (typeof unit === 'string') {
    return { iri: unit, name: unit };
  }
  const id = unit.id ?? unit['@id']?.split('/').pop();
  if (!id) return null;
  const iri = unit['@id'] ?? `/api/v1/units/${id}`;
  return { iri, name: unit.name || String(id) };
}

/**
 * True when the role grants event creation: an explicit admin flag, or a
 * *Permission field (e.g. localCenterPermission) whose value starts with EVENT_ or ADMIN_.
 * Reads named fields only, never the serialized role.
 */
export function roleAllowsEventCreate(role: OrgoUserRoleRow): boolean {
  if (role.isAdmin === true) return true;
  return Object.entries(role).some(
    ([key, value]) =>
      key.endsWith('Permission') &&
      typeof value === 'string' &&
      EVENT_CREATE_PREFIXES.some((prefix) => value.toUpperCase().startsWith(prefix))
  );
}

/** Units of active roles that grant event creation. No fallback to other roles. */
export function filterEventCreateUnits(roles: OrgoUserRoleRow[]): OrgoUnitOption[] {
  const seen = new Map<string, OrgoUnitOption>();
  for (const role of roles) {
    if (role.dateEnded || !roleAllowsEventCreate(role)) continue;
    const unit = unitFromRole(role);
    if (unit) seen.set(unit.iri, unit);
  }
  return [...seen.values()];
}

export async function findOrgoUserId(email: string): Promise<string | null> {
  const response = await orgoFetch(`/api/v1/users?email=${encodeURIComponent(email)}&itemsPerPage=5`);
  if (!response.ok) return null;
  const body = (await response.json()) as HydraCollection<OrgoUserRow>;
  // Exact, case-insensitive email match only: never act on another person's Orgo identity.
  const wanted = email.trim().toLowerCase();
  const match = hydraMembers(body).find((row) => row.email?.trim().toLowerCase() === wanted);
  if (!match) return null;
  if (match['@id']) return match['@id'];
  if (match.id != null) return `/api/v1/users/${match.id}`;
  return null;
}

export type CreatedOrgoEvent = {
  uuid: string;
  url: string;
  /** Numeric event id: Orgo's file and attendance calls take this, not the uuid. */
  eventId?: number;
};

export async function createOrgoEvent(payload: OrgoEventPayload): Promise<CreatedOrgoEvent> {
  const response = await orgoFetch('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new OrgoRequestError(response.status, text || 'Orgo recusou o evento');
  }
  const body = (await response.json()) as { uuid?: string; id?: string | number; '@id'?: string };
  const uuid = body.uuid || body['@id']?.split('/').pop();
  if (!uuid) {
    throw new OrgoRequestError(502, 'Orgo não devolveu o identificador do evento');
  }
  return {
    uuid: String(uuid),
    url: orgoEventUrl(String(uuid)),
    ...(typeof body.id === 'number' ? { eventId: body.id } : {}),
  };
}

export async function publishOrgoEvent(uuid: string): Promise<void> {
  // Orgo's PATCH endpoints only accept merge-patch; plain application/json answers 415.
  const response = await orgoFetch(`/api/v1/events_publish/${encodeURIComponent(uuid)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/merge-patch+json' },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new OrgoRequestError(response.status, text || 'Orgo recusou a publicação');
  }
}

export class OrgoRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'OrgoRequestError';
    this.status = status;
  }
}

export const E2E_STUB_UNITS: OrgoUnitOption[] = [
  { iri: '/api/v1/units/123', name: 'Agrupamento 123' },
  { iri: '/api/v1/units/456', name: 'Agrupamento 456' },
];

// --- Leader scope, members, invitations, files and attendance -----------------------------
// The write token acts as one Orgo admin, so everything below that returns people is
// limited by the caller (see ./scope.ts); nothing here stores or logs member data.

/** Orgo ids are numeric. Anything else is refused before it can reach a request path. */
function requireNumericId(value: string | number, what: string): string {
  const id = String(value);
  if (!/^\d+$/.test(id)) {
    throw new OrgoRequestError(400, `Identificador inválido: ${what}`);
  }
  return id;
}

function idFrom(value: unknown): string | null {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.split('/').pop() || null;
  if (value && typeof value === 'object') {
    const row = value as { id?: unknown; '@id'?: unknown };
    return idFrom(row.id ?? row['@id']);
  }
  return null;
}

async function failFrom(response: Response, fallback: string): Promise<never> {
  const text = await response.text().catch(() => '');
  throw new OrgoRequestError(response.status, text || fallback);
}

export type OrgoUserRecord = {
  id: string;
  status: string | null;
  type: string | null;
  localCenterId: string | null;
  /** Orgo permission strings such as EVENT_LOCAL. Only the names, never personal data. */
  permissions: string[];
};

/** The Orgo user behind a login (`sub`), with the permissions that decide the leader's scope. */
export async function getOrgoUser(orgoUserId: string): Promise<OrgoUserRecord | null> {
  const id = requireNumericId(orgoUserId, 'utilizador');
  const response = await orgoFetch(`/api/v1/users/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) await failFrom(response, 'Orgo recusou a leitura do utilizador');
  const body = (await response.json()) as {
    id?: number | string;
    status?: string;
    type?: { name?: string } | string | null;
    localCenter?: unknown;
    permissions?: unknown;
  };
  return {
    id: String(body.id ?? id),
    status: typeof body.status === 'string' ? body.status : null,
    type: typeof body.type === 'string' ? body.type : (body.type?.name ?? null),
    localCenterId: idFrom(body.localCenter),
    permissions: Array.isArray(body.permissions)
      ? body.permissions.filter((p): p is string => typeof p === 'string')
      : [],
  };
}

export type OrgoMember = {
  /** Opaque Orgo user id, used only to invite. */
  id: string;
  name: string;
  /** Card number (número associativo). */
  cardId: string | null;
  /** The member's type: Lobito, Explorador, Escoteiro, Caminheiro or Dirigente. */
  type: string | null;
};

const MEMBER_PAGE_SIZE = 100;
const MEMBER_MAX = 1000;

/**
 * Active members of ONE local center. The local center id comes from the leader's own
 * Orgo account (never from the browser), so the list cannot reach beyond their group.
 */
export async function listLocalCenterMembers(localCenterId: string): Promise<OrgoMember[]> {
  const center = requireNumericId(localCenterId, 'grupo');
  const members: OrgoMember[] = [];
  for (let page = 1; members.length < MEMBER_MAX; page += 1) {
    const response = await orgoFetch(
      `/api/v1/users?localCenter=${center}&itemsPerPage=${MEMBER_PAGE_SIZE}&page=${page}`
    );
    if (!response.ok) await failFrom(response, 'Orgo recusou a lista de membros');
    const rows = hydraMembers(
      (await response.json()) as HydraCollection<{
        id?: number | string;
        status?: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        cardId?: string | number | null;
        type?: { name?: string } | string | null;
      }>
    );
    for (const row of rows) {
      if (row.id == null || (row.status && row.status !== 'ACTIVE')) continue;
      const name =
        row.fullName?.trim() || [row.firstName, row.lastName].filter(Boolean).join(' ').trim();
      if (!name) continue;
      members.push({
        id: String(row.id),
        name,
        cardId: row.cardId != null && String(row.cardId) !== '' ? String(row.cardId) : null,
        type: typeof row.type === 'string' ? row.type : (row.type?.name ?? null),
      });
    }
    if (rows.length < MEMBER_PAGE_SIZE) break;
  }
  return members.slice(0, MEMBER_MAX);
}

export type OrgoLocalUnit = {
  id: string;
  name: string;
  /** "divisao" for a division, "patrulha" for a patrulha, bando or equipa. */
  kind: 'divisao' | 'patrulha';
  parentId: string | null;
  /** The member type this unit holds, which is how a member is matched to a division. */
  userType: string | null;
};

/** The divisões and patrulhas of a local center (the unit tree). */
export async function listLocalCenterUnits(localCenterId: string): Promise<OrgoLocalUnit[]> {
  const center = requireNumericId(localCenterId, 'grupo');
  const response = await orgoFetch(`/api/v1/local_centers/${center}`);
  if (!response.ok) await failFrom(response, 'Orgo recusou a leitura do grupo');
  const body = (await response.json()) as { localUnits?: unknown[] };
  const ids = (body.localUnits ?? []).map(idFrom).filter((id): id is string => Boolean(id));

  const units: OrgoLocalUnit[] = [];
  for (let i = 0; i < ids.length; i += 5) {
    const batch = await Promise.all(
      ids.slice(i, i + 5).map(async (id) => {
        const res = await orgoFetch(`/api/v1/units/${requireNumericId(id, 'unidade')}`);
        if (!res.ok) return null;
        const unit = (await res.json()) as {
          id?: number | string;
          name?: string;
          parent?: unknown;
          unitType?: { name?: string } | string | null;
          userType?: { name?: string } | string | null;
          status?: string;
        };
        if (!unit.name || (unit.status && unit.status !== 'ACTIVE')) return null;
        const unitType = typeof unit.unitType === 'string' ? unit.unitType : (unit.unitType?.name ?? '');
        return {
          id: String(unit.id ?? id),
          name: unit.name,
          kind: /divis/i.test(unitType) ? 'divisao' : 'patrulha',
          parentId: idFrom(unit.parent),
          userType: typeof unit.userType === 'string' ? unit.userType : (unit.userType?.name ?? null),
        } satisfies OrgoLocalUnit;
      })
    );
    units.push(...batch.filter((unit): unit is OrgoLocalUnit => unit !== null));
  }
  return units;
}

export type InviteResult = 'invited' | 'already';

/**
 * Invites one member to a published event. Orgo refuses invitations to a draft, and
 * answers 400 "already attending" for a repeat, which counts as added.
 */
export async function inviteOrgoUser(eventUuid: string, orgoUserId: string): Promise<InviteResult> {
  const user = requireNumericId(orgoUserId, 'membro');
  const response = await orgoFetch('/api/v1/event_attends', {
    method: 'POST',
    body: JSON.stringify({
      event: `/api/v1/events/${encodeURIComponent(eventUuid)}`,
      user: `/api/v1/users/${user}`,
      isInvited: true,
    }),
  });
  if (response.ok) return 'invited';
  const text = await response.text().catch(() => '');
  if (response.status === 400 && /already attending/i.test(text)) return 'already';
  throw new OrgoRequestError(response.status, text || 'Orgo recusou o convite');
}

export type OrgoEventState = {
  eventId: number;
  status: string | null;
  /** True when the event already carries a file attachment, so a retry never attaches twice. */
  hasFile: boolean;
};

/** The numeric id, status and attachment state of an event, for the calls that need them. */
export async function getOrgoEvent(uuid: string): Promise<OrgoEventState | null> {
  const response = await orgoFetch(`/api/v1/events/${encodeURIComponent(uuid)}`);
  if (response.status === 404) return null;
  if (!response.ok) await failFrom(response, 'Orgo recusou a leitura do evento');
  const body = (await response.json()) as {
    id?: unknown;
    status?: unknown;
    eventMedia?: Array<{ media?: { type?: unknown } | null }>;
  };
  if (typeof body.id !== 'number') return null;
  return {
    eventId: body.id,
    status: typeof body.status === 'string' ? body.status : null,
    hasFile: Array.isArray(body.eventMedia) && body.eventMedia.some((item) => item?.media?.type === 'eventfile'),
  };
}

/** A unit by id (used for the group-level unit, whose id is the local group's id). */
export async function getOrgoUnit(unitId: string): Promise<{ id: string; name: string } | null> {
  const id = requireNumericId(unitId, 'unidade');
  const response = await orgoFetch(`/api/v1/units/${id}`);
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) await failFrom(response, 'Orgo recusou a leitura da unidade');
  const body = (await response.json()) as { id?: number | string; name?: string };
  return body.name ? { id: String(body.id ?? id), name: body.name } : null;
}

export type OrgoAttendanceCounts = {
  /** Members invited to the event. */
  invited: number | null;
  /** Members whose answer is "attending": checked in on the attendance page, or said yes themselves. */
  attending: number | null;
};

/**
 * Counts for an event from Orgo's analytics. Counts only, no people. Orgo uses the same
 * "attending" answer for a member checked in by a leader and for a member who replied yes, so
 * this cannot tell "present" from "confirmed".
 */
export async function getOrgoAttendanceCounts(uuid: string): Promise<OrgoAttendanceCounts | null> {
  const response = await orgoFetch(`/api/v1/events/${encodeURIComponent(uuid)}/analytics`);
  if (!response.ok) return null;
  const body = (await response.json()) as {
    attendees?: Record<string, unknown> | null;
    rsvp?: Record<string, unknown> | null;
  };
  const count = (value: unknown) => (typeof value === 'number' && value >= 0 ? value : null);
  return { invited: count(body.attendees?.['invited']), attending: count(body.rsvp?.['attending']) };
}

export type OrgoFileInput = { name: string; mimeType: string; bytes: Uint8Array };

/**
 * Attaches a file to an event the way the eAEP web app does: ask Orgo for a signed upload,
 * send the file to the storage address Orgo returns, register it on the event.
 * Orgo stores event files so that anyone with the link can open them.
 */
export async function attachFileToOrgoEvent(eventId: number, file: OrgoFileInput): Promise<void> {
  const id = requireNumericId(eventId, 'evento');
  const sign = await orgoFetch(
    `/api/v1/s3-upload?fileType=${encodeURIComponent(file.mimeType)}&fileName=${encodeURIComponent(file.name)}&type=eventfile`
  );
  if (!sign.ok) await failFrom(sign, 'Orgo recusou o envio do ficheiro');
  const signed = (await sign.json()) as {
    url?: string;
    newFileName?: string;
    additionalData?: Record<string, string>;
  };
  if (!signed.url || !signed.newFileName) {
    throw new OrgoRequestError(502, 'Orgo não devolveu o destino do ficheiro');
  }

  // The storage address comes from Orgo's answer. Only send the file to https storage, and
  // never send the API token there (plain fetch, no Orgo headers).
  const target = new URL(signed.url);
  if (target.protocol !== 'https:' || !target.hostname.endsWith('.amazonaws.com')) {
    throw new OrgoRequestError(502, 'Destino do ficheiro não reconhecido');
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(signed.additionalData ?? {})) form.append(key, value);
  form.append('Content-type', file.mimeType);
  form.append('acl', 'public-read');
  form.append('file', new Blob([file.bytes as BlobPart], { type: file.mimeType }), signed.newFileName);
  const upload = await fetch(target.toString(), { method: 'POST', body: form });
  if (upload.status !== 200 && upload.status !== 204) {
    throw new OrgoRequestError(upload.status, 'O envio do ficheiro para o eAEP falhou');
  }

  const register = await orgoFetch('/api/v1/medias', {
    method: 'POST',
    body: JSON.stringify({
      contentUrl: signed.newFileName,
      mimeType: file.mimeType,
      type: 'eventfile',
      size: file.bytes.byteLength,
      entityId: Number(id),
    }),
  });
  if (!register.ok) await failFrom(register, 'Orgo recusou o registo do ficheiro');
}
