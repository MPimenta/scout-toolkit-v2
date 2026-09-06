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

type OrgoUserRoleRow = {
  unit?: string | { id?: number | string; name?: string; '@id'?: string };
  dateEnded?: string | null;
};

const EVENT_CREATE_HINTS = ['EVENT_', 'ADMIN_'];

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

function roleAllowsEventCreate(role: OrgoUserRoleRow): boolean {
  const text = JSON.stringify(role);
  return EVENT_CREATE_HINTS.some((hint) => text.includes(hint)) || text.includes('"isAdmin":true');
}

export function filterEventCreateUnits(roles: OrgoUserRoleRow[]): OrgoUnitOption[] {
  const eligible = roles.filter(roleAllowsEventCreate);
  const source = eligible.length > 0 ? eligible : roles;
  const seen = new Map<string, OrgoUnitOption>();
  for (const role of source) {
    const unit = unitFromRole(role);
    if (unit) seen.set(unit.iri, unit);
  }
  return [...seen.values()];
}

export async function findOrgoUserId(email: string): Promise<string | null> {
  const response = await orgoFetch(`/api/v1/users?email=${encodeURIComponent(email)}&itemsPerPage=5`);
  if (!response.ok) return null;
  const body = (await response.json()) as HydraCollection<OrgoUserRow>;
  const match = hydraMembers(body).find((row) => row.email?.toLowerCase() === email.toLowerCase()) ?? hydraMembers(body)[0];
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
