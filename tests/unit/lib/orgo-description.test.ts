import { describe, expect, it } from 'vitest';
import {
  buildOrgoDescription,
  escapeOrgoHtml,
  type DescriptionChallenge,
  type DescriptionProgram,
} from '@/lib/orgo/description';
import { assembleChallenges } from '@/lib/orgo/description-data';

const block = (start: string, end: string, durationMinutes: number, title: string) => ({
  start,
  end,
  durationMinutes,
  title,
});

const challenge = (overrides: Partial<DescriptionChallenge> = {}): DescriptionChallenge => ({
  code: 'CC-A',
  shortTitle: 'Título curto',
  ageGroup: 'cub_scouts',
  mandatory: false,
  blocks: ['Atividade principal'],
  behaviours: ['Participa nas decisões do grupo'],
  ...overrides,
});

const program = (overrides: Partial<DescriptionProgram> = {}): DescriptionProgram => ({
  name: 'Acampamento de Verão',
  blocks: [
    block('10:00', '10:30', 30, 'Jogo de apresentação'),
    block('10:30', '12:00', 90, 'Atividade principal'),
    block('12:00', '13:00', 60, 'Almoço'),
  ],
  challenges: [],
  ...overrides,
});

/** Tags Orgo renders. Anything else (table, div, script, img, style) would be dropped or unsafe. */
const ALLOWED_TAGS = new Set(['p', 'b', 'i', 'h3', 'ul', 'li', 'br']);
function tagsIn(html: string): string[] {
  return [...html.matchAll(/<\/?([a-z0-9]+)/gi)].map((m) => (m[1] ?? '').toLowerCase());
}

describe('buildOrgoDescription', () => {
  it('starts with an intro and lists one line per block, in order', () => {
    const html = buildOrgoDescription(program());
    expect(html.startsWith('<p><b>Programa «Acampamento de Verão»</b>, criado no Kit de Atividades.</p>')).toBe(true);
    const items = [...html.matchAll(/<li>(.*?)<\/li>/g)].map((m) => m[1]);
    expect(items).toEqual([
      '10:00–10:30 (30 min) · Jogo de apresentação',
      '10:30–12:00 (90 min) · Atividade principal',
      '12:00–13:00 (60 min) · Almoço',
    ]);
  });

  it('has only the intro for a program without blocks', () => {
    const html = buildOrgoDescription(program({ blocks: [] }));
    expect(html).toBe('<p><b>Programa «Acampamento de Verão»</b>, criado no Kit de Atividades.</p>');
  });

  it('omits the desafios section when no activity is linked to a desafio', () => {
    const html = buildOrgoDescription(program({ challenges: [] }));
    expect(html).not.toContain('Desafios');
  });

  it('shows code, short title, division, blocks and behaviours of a desafio', () => {
    const html = buildOrgoDescription(program({ challenges: [challenge()] }));
    expect(html).toContain('<h3>Desafios que podem ser assinados</h3>');
    expect(html).toContain('só pode ser assinado se os comportamentos forem observados');
    expect(html).toContain('<b>CC-A</b> · Título curto (Lobitos)');
    expect(html).toContain('Blocos: Atividade principal');
    expect(html).toContain('<li>Participa nas decisões do grupo</li>');
  });

  it('marks a desafio that is mandatory for integration, for its division', () => {
    const html = buildOrgoDescription(program({ challenges: [challenge({ mandatory: true })] }));
    expect(html).toContain('Obrigatório para a integração (Lobitos)');
    expect(buildOrgoDescription(program({ challenges: [challenge({ mandatory: false })] }))).not.toContain(
      'Obrigatório'
    );
  });

  it('orders desafios by code', () => {
    const html = buildOrgoDescription(
      program({ challenges: [challenge({ code: 'ZZ-9' }), challenge({ code: 'AA-1' })] })
    );
    expect(html.indexOf('AA-1')).toBeLessThan(html.indexOf('ZZ-9'));
  });

  it('writes stored markup as escaped text, never as tags', () => {
    const html = buildOrgoDescription(
      program({
        name: 'Jogo <script>alert(1)</script> & "amigos"',
        blocks: [block('10:00', '11:00', 60, '<img src=x onerror=alert(1)>')],
        challenges: [challenge({ shortTitle: '<b>x</b>', behaviours: ['<a href="javascript:1">ver</a>'], blocks: ['<i>b</i>'] })],
      })
    );
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<img/i);
    expect(html).not.toMatch(/<a /i);
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;amigos&quot;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    for (const tag of tagsIn(html)) expect(ALLOWED_TAGS.has(tag)).toBe(true);
  });

  it('uses only tags that Orgo renders', () => {
    const html = buildOrgoDescription(program({ challenges: [challenge({ mandatory: true })] }));
    expect(tagsIn(html).every((tag) => ALLOWED_TAGS.has(tag))).toBe(true);
    expect(html).not.toMatch(/<table|<div|<span|style=/i);
  });

  it('shortens the desafios to codes and short titles when the text is too long, keeping the whole program list', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      challenge({ code: `C-${String(i).padStart(2, '0')}`, behaviours: Array.from({ length: 5 }, (_, j) => `Comportamento ${i}.${j} ${'x'.repeat(40)}`) })
    );
    const full = buildOrgoDescription(program({ challenges: many }), 1_000_000);
    const limit = Math.floor(full.length / 2);
    const html = buildOrgoDescription(program({ challenges: many }), limit);

    expect(html.length).toBeLessThanOrEqual(limit);
    expect(html).toContain('10:00–10:30 (30 min) · Jogo de apresentação');
    expect(html).toContain('12:00–13:00 (60 min) · Almoço');
    expect(html).toContain('<b>C-00</b>');
    expect(html).not.toContain('Comportamentos a observar');
  });

  it('drops the desafios only when even the short list does not fit, and keeps the program list', () => {
    const html = buildOrgoDescription(program({ challenges: [challenge()] }), 330);
    expect(html).not.toContain('Desafios');
    expect(html).toContain('12:00–13:00 (60 min) · Almoço');
  });
});

describe('escapeOrgoHtml', () => {
  it('escapes the characters that matter in HTML text and attributes', () => {
    expect(escapeOrgoHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;');
  });
});

describe('assembleChallenges', () => {
  const blocks = [
    { ...block('10:00', '10:30', 30, 'Jogo'), activityId: 'act-1' },
    { ...block('10:30', '11:00', 30, 'Roda'), activityId: 'act-2' },
    { ...block('11:00', '11:30', 30, 'Pausa'), activityId: null },
  ];
  const link = (activityId: string, challengeId: string, extra = {}) => ({
    activityId,
    challengeId,
    code: challengeId.toUpperCase(),
    shortTitle: null,
    title: `Título completo ${challengeId}`,
    ageGroup: 'cub_scouts' as const,
    integrationAgeGroups: [] as string[],
    ...extra,
  });

  it('lists the blocks whose activity is linked to the desafio', () => {
    const result = assembleChallenges(blocks, [link('act-1', 'c1'), link('act-2', 'c1')], []);
    expect(result).toHaveLength(1);
    expect(result[0]?.blocks).toEqual(['Jogo', 'Roda']);
  });

  it('lists contributing blocks in program order, not in the order the links came back', () => {
    const result = assembleChallenges(blocks, [link('act-2', 'c1'), link('act-1', 'c1')], []);
    expect(result[0]?.blocks).toEqual(['Jogo', 'Roda']);
  });

  it('falls back to the full title when there is no short title', () => {
    const [result] = assembleChallenges(blocks, [link('act-1', 'c1')], []);
    expect(result?.shortTitle).toBe('Título completo c1');
    const [withShort] = assembleChallenges(blocks, [link('act-1', 'c1', { shortTitle: ' Curto ' })], []);
    expect(withShort?.shortTitle).toBe('Curto');
  });

  it('marks mandatory only when the desafio division is in its integration divisions', () => {
    const [yes] = assembleChallenges(blocks, [link('act-1', 'c1', { integrationAgeGroups: ['cub_scouts'] })], []);
    const [no] = assembleChallenges(blocks, [link('act-1', 'c1', { integrationAgeGroups: ['scouts'] })], []);
    expect(yes?.mandatory).toBe(true);
    expect(no?.mandatory).toBe(false);
  });

  it('lists a behaviour only for an activity linked to that desafio, without repeats', () => {
    const behaviours = [
      { activityId: 'act-1', challengeId: 'c1', behaviour: ' Respeita as regras ' },
      { activityId: 'act-2', challengeId: 'c1', behaviour: 'Respeita as regras' },
      // act-2 is not linked to c2, so its behaviour must not be offered under c2
      { activityId: 'act-2', challengeId: 'c2', behaviour: 'Intruso' },
    ];
    const result = assembleChallenges(
      blocks,
      [link('act-1', 'c1'), link('act-2', 'c1'), link('act-1', 'c2')],
      behaviours
    );
    const c1 = result.find((c) => c.code === 'C1');
    const c2 = result.find((c) => c.code === 'C2');
    expect(c1?.behaviours).toEqual(['Respeita as regras']);
    expect(c2?.behaviours).toEqual([]);
  });

  it('returns nothing when no activity is linked to a desafio', () => {
    expect(assembleChallenges(blocks, [], [])).toEqual([]);
  });
});
