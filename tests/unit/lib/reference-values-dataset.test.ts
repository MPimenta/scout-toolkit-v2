import { describe, expect, it } from 'vitest';
import { ACTIVITY_FOCUSES, ACTIVITY_FORMATS } from '@/lib/reference-data/activity-formats-focuses';
import { ACTIVITY_SOURCES } from '@/lib/reference-data/activity-sources';
import { sdgIconUrl } from '@/lib/reference-data/sdg-icons';

describe('formats and focuses dataset (reference sheet)', () => {
  it('has the 8 official formats and 10 official focuses', () => {
    expect(ACTIVITY_FORMATS.map((f) => f.name)).toEqual([
      'Jogo',
      'Quebra-gelo',
      'Reflexão/Debriefing',
      'Técnica/Oficina',
      'Desafio/Iniciativa',
      'Expressão criativa',
      'Energizante',
      'Aventura/Percurso',
    ]);
    expect(ACTIVITY_FOCUSES.map((f) => f.name)).toEqual([
      'Cooperação',
      'Bem-estar físico',
      'Competências técnicas',
      'Valores/Reflexão',
      'Criatividade',
      'Competição amigável',
      'Liderança',
      'Resolução de problemas',
      'Comunicação',
      'Confiança',
    ]);
  });

  it('gives every value a unique code, a description and consecutive positions', () => {
    for (const list of [ACTIVITY_FORMATS, ACTIVITY_FOCUSES]) {
      expect(new Set(list.map((v) => v.code)).size).toBe(list.length);
      expect(list.map((v) => v.position)).toEqual(list.map((_, i) => i + 1));
      for (const value of list) expect(value.description.length).toBeGreaterThan(10);
    }
  });

  it('no longer has the former type Serviço', () => {
    expect([...ACTIVITY_FORMATS, ...ACTIVITY_FOCUSES].some((v) => v.name === 'Serviço')).toBe(false);
  });
});

describe('activity sources dataset', () => {
  it('carries the sheet priority, or none when the sheet has none', () => {
    const byCode = new Map(ACTIVITY_SOURCES.map((s) => [s.code, s.priority]));
    expect(byCode.get('PLAY14')).toBe(1);
    expect(byCode.get('OSM')).toBe(4);
    expect(byCode.get('SCOUTNET')).toBe(2);
    expect(byCode.get('PESSOAL')).toBeNull();
    for (const priority of byCode.values()) expect(priority === null || (priority >= 1 && priority <= 4)).toBe(true);
  });
});

describe('ODS icons', () => {
  it('uses its own image for every ODS, including 11', () => {
    expect(sdgIconUrl(11)).toBe('/sdg-icons/sdg-11.png');
    expect(new Set(Array.from({ length: 17 }, (_, i) => sdgIconUrl(i + 1))).size).toBe(17);
  });
});
