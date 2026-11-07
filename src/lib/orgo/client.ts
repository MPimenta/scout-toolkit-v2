import { getOrgoApiToken, getOrgoIssuer } from './config';
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

export async function listEventCreateUnitsForEmail(email: string): Promise<OrgoUnitOption[]> {
  const userIri = await findOrgoUserId(email);
  if (!userIri) return [];
  const response = await orgoFetch(
    `/api/v1/user_roles?user=${encodeURIComponent(userIri)}&pagination=false`
  );
  if (!response.ok) return [];
  const body = (await response.json()) as HydraCollection<OrgoUserRoleRow>;
  return filterEventCreateUnits(hydraMembers(body));
}

export type CreatedOrgoEvent = {
  uuid: string;
  url: string;
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
  const body = (await response.json()) as { uuid?: string; id?: string; '@id'?: string };
  const uuid = body.uuid || body.id || body['@id']?.split('/').pop();
  if (!uuid) {
    throw new OrgoRequestError(502, 'Orgo não devolveu o identificador do evento');
  }
  return {
    uuid: String(uuid),
    url: `${getOrgoIssuer()}/events/${uuid}`,
  };
}

export async function publishOrgoEvent(uuid: string): Promise<void> {
  const response = await orgoFetch(`/api/v1/events_publish/${uuid}`, {
    method: 'PATCH',
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
