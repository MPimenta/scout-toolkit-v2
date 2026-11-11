import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { activityFocuses, activityFormats } from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyActivityFormatsAndFocuses } from '@/lib/reference-data/activity-formats-focuses';
import { createActivity, parseActivityWrite } from '@/lib/activities/write';
import { GET as listActivities } from '@/app/api/activities/route';
import { GET as getActivity } from '@/app/api/activities/[id]/route';
import { GET as listFormats } from '@/app/api/taxonomies/activity-formats/route';
import { GET as listFocuses } from '@/app/api/taxonomies/activity-focuses/route';

vi.mock('@/lib/auth/config', () => ({ auth: async () => null }));
vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: async () => ({ user: { id: 'admin-1', role: 'admin' } }),
}));

type Handler = (request: NextRequest, ctx: { params: Promise<{ kind: string }> }) => Promise<Response>;

async function admin(method: 'POST' | 'PATCH' | 'DELETE', kind: string, body?: unknown, query = '') {
  const route = await import('@/app/api/admin/taxonomies/[kind]/route');
  const request = new NextRequest(`http://localhost/api/admin/taxonomies/${kind}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (route[method] as Handler)(request, { params: Promise.resolve({ kind }) });
}

const search = async (qs: string) => {
  const response = await listActivities(new NextRequest(`http://localhost:3000/api/activities?${qs}`));
  const body = await response.json();
  return { status: response.status, names: ((body.activities ?? []) as { name: string }[]).map((a) => a.name).sort(), body };
};

describe('Activity format and focus (API)', () => {
  const id: Record<string, string> = {};

  async function make(name: string, format: string, focus: string, secondary: string | null, approved = true, extra: Record<string, unknown> = {}) {
    const parsed = parseActivityWrite({
      name,
      description: 'd',
      materials: 'm',
      approximate_duration_minutes: 20,
      group_sizes: ['medium'],
      effort_level: 'low',
      locations: ['inside'],
      age_groups: ['scouts'],
      format_id: id[format],
      focus_id: id[focus],
      secondary_focus_id: secondary ? id[secondary] : null,
      ...extra,
    });
    if (typeof parsed === 'string') throw new Error(parsed);
    return createActivity(parsed, { isApproved: approved });
  }

  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await applyActivityFormatsAndFocuses(db);
    for (const row of await db.select().from(activityFormats)) id[row.code] = row.id;
    for (const row of await db.select().from(activityFocuses)) id[row.code] = row.id;
  });

  describe('public lists', () => {
    it('lists the formats and focuses in sheet order with descriptions', async () => {
      const formats = (await (await listFormats()).json()).activity_formats as { name: string; description: string; activity_count: number }[];
      expect(formats.map((f) => f.name).slice(0, 3)).toEqual(['Jogo', 'Quebra-gelo', 'Reflexão/Debriefing']);
      expect(formats).toHaveLength(8);
      expect(formats.every((f) => f.description)).toBe(true);
      const focuses = (await (await listFocuses()).json()).activity_focuses as { name: string }[];
      expect(focuses).toHaveLength(10);
    });

    it('counts approved activities only, and a focus counts as main or secondary', async () => {
      await make('A', 'jogo', 'lideranca', 'cooperacao');
      await make('B', 'jogo', 'cooperacao', null);
      await make('C', 'quebra-gelo', 'cooperacao', 'lideranca', false); // not approved: not counted
      const formats = (await (await listFormats()).json()).activity_formats as { code: string; activity_count: number }[];
      const focuses = (await (await listFocuses()).json()).activity_focuses as { code: string; activity_count: number }[];
      expect(formats.find((f) => f.code === 'jogo')!.activity_count).toBe(2);
      expect(formats.find((f) => f.code === 'quebra-gelo')!.activity_count).toBe(0);
      expect(focuses.find((f) => f.code === 'lideranca')!.activity_count).toBe(1); // A as main
      expect(focuses.find((f) => f.code === 'cooperacao')!.activity_count).toBe(2); // A secondary, B main
    });
  });

  describe('catalogue filters', () => {
    beforeEach(async () => {
      await make('Jogo de liderança', 'jogo', 'lideranca', 'cooperacao');
      await make('Jogo de cooperação', 'jogo', 'cooperacao', null);
      await make('Quebra-gelo de comunicação', 'quebra-gelo', 'comunicacao', 'lideranca');
      await make('Oficina técnica', 'tecnica-oficina', 'competencias-tecnicas', null);
    });

    it('filters by format, and several formats match any', async () => {
      expect((await search(`format=${id['jogo']}`)).names).toEqual(['Jogo de cooperação', 'Jogo de liderança']);
      expect((await search(`format=${id['jogo']},${id['tecnica-oficina']}`)).names).toHaveLength(3);
    });

    it('matches a focus when it is the main or the secondary one', async () => {
      expect((await search(`focus=${id['lideranca']}`)).names).toEqual(['Jogo de liderança', 'Quebra-gelo de comunicação']);
      expect((await search(`focus=${id['cooperacao']}`)).names).toEqual(['Jogo de cooperação', 'Jogo de liderança']);
    });

    it('combines format and focus with AND, and counts the total correctly', async () => {
      const result = await search(`format=${id['jogo']}&focus=${id['lideranca']}`);
      expect(result.names).toEqual(['Jogo de liderança']);
      expect(result.body.pagination.total).toBe(1);
    });

    it('rejects a malformed id', async () => {
      expect((await search('format=nao-e-um-id')).status).toBe(400);
    });

    it('returns the format and focuses of every activity', async () => {
      const { body } = await search(`format=${id['jogo']}&focus=${id['lideranca']}`);
      expect(body.activities[0]).toMatchObject({
        format: { code: 'jogo', name: 'Jogo' },
        focus: { code: 'lideranca' },
        secondary_focus: { code: 'cooperacao' },
      });
    });
  });

  describe('detail', () => {
    it('returns format, focuses, the duration range and the sheet id', async () => {
      const created = await make('Detalhe', 'energizante', 'bem-estar-fisico', 'comunicacao', true, {
        duration_min_minutes: 10,
        duration_max_minutes: 25,
      });
      const response = await getActivity(new NextRequest(`http://localhost:3000/api/activities/${created.id}`), {
        params: Promise.resolve({ id: created.id }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        format: { name: 'Energizante' },
        focus: { name: 'Bem-estar físico' },
        secondary_focus: { name: 'Comunicação' },
        duration_min_minutes: 10,
        duration_max_minutes: 25,
        external_id: null,
      });
    });
  });

  describe('admin management', () => {
    it('answers 409 when renaming or deleting a value from the sheet', async () => {
      expect((await admin('PATCH', 'activity-formats', { id: id['jogo'], name: 'Outro' })).status).toBe(409);
      expect((await admin('DELETE', 'activity-formats', undefined, `?id=${id['jogo']}`)).status).toBe(409);
      expect((await admin('PATCH', 'activity-focuses', { id: id['lideranca'], name: 'Outro' })).status).toBe(409);
      expect((await admin('DELETE', 'activity-focuses', undefined, `?id=${id['lideranca']}`)).status).toBe(409);
      const [row] = await db.select().from(activityFormats).where(eq(activityFormats.id, id['jogo']!));
      expect(row?.name).toBe('Jogo');
    });

    it('lets an admin add, rename and delete a value of their own', async () => {
      const created = await admin('POST', 'activity-focuses', { name: 'Sustentabilidade', description: 'Cuidar do ambiente.' });
      expect(created.status).toBe(201);
      const { item } = await created.json();
      expect(item).toMatchObject({ code: 'sustentabilidade', is_managed: false, position: 1000 });

      expect((await admin('POST', 'activity-focuses', { name: 'Sustentabilidade' })).status).toBe(409);
      const renamed = await admin('PATCH', 'activity-focuses', { id: item.id, name: 'Ambiente' });
      expect((await renamed.json()).item).toMatchObject({ name: 'Ambiente', code: 'sustentabilidade' }); // the code never changes
      expect((await admin('DELETE', 'activity-focuses', undefined, `?id=${item.id}`)).status).toBe(200);
    });

    it('refuses to delete an own value that activities still use', async () => {
      const { item } = await (await admin('POST', 'activity-formats', { name: 'Peça de teatro' })).json();
      id['peca-de-teatro'] = item.id;
      await make('Com formato próprio', 'peca-de-teatro', 'cooperacao', null);
      expect((await admin('DELETE', 'activity-formats', undefined, `?id=${item.id}`)).status).toBe(409);
    });

    it('validates the name', async () => {
      expect((await admin('POST', 'activity-formats', { name: '   ' })).status).toBe(400);
    });
  });
});
