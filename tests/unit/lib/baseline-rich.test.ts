import { describe, expect, it } from 'vitest';
import {
  matchSource,
  parseChallengeCodes,
  parseDivisionBlocks,
  parseRiskCell,
  parseSdgJustifications,
} from '@/lib/activities/baseline-rich';

// Synthetic cells shaped like the curated sheet; no real sheet text is committed.
describe('parseRiskCell', () => {
  it('splits level and text at the first colon', () => {
    expect(parseRiskCell('Médio: corridas e apanhadas com risco de colisões.')).toEqual({
      level: 'medium',
      text: 'corridas e apanhadas com risco de colisões.',
      range: false,
    });
    expect(parseRiskCell('Baixo: pouco risco').level).toBe('low');
    expect(parseRiskCell('Alto: risco elevado').level).toBe('high');
  });

  it('stores the higher level for a range and keeps the original wording', () => {
    expect(parseRiskCell('Baixo a médio: vergonha de falhar o ritmo.')).toEqual({
      level: 'medium',
      text: 'Baixo a médio: vergonha de falhar o ritmo.',
      range: true,
    });
  });

  it('keeps text without a recognisable level and ignores placeholders', () => {
    expect(parseRiskCell('Sem nível aqui')).toEqual({ level: null, text: 'Sem nível aqui', range: false });
    expect(parseRiskCell('-')).toEqual({ level: null, text: null, range: false });
    expect(parseRiskCell(undefined).level).toBeNull();
  });
});

describe('parseDivisionBlocks', () => {
  const objectives = `Lobitos:
• 4E.1.1 Participar em momentos de partilha
• 4S.2.1 Liderar a execução de tarefas

Escoteiros:
• 5I.2 Demonstrar criatividade

Dirigentes (referência: objetivos de Caminheiros):
• 5I.3-4 Demonstrar criatividade e capacidade de adaptação`;

  it('reads one block per division with canonical codes', () => {
    const { blocks } = parseDivisionBlocks(objectives);
    expect([...blocks.keys()]).toEqual(['cub_scouts', 'scouts', 'leaders']);
    expect(blocks.get('cub_scouts')).toEqual([
      { code: '4E.1.1', text: 'Participar em momentos de partilha' },
      { code: '4S.2.1', text: 'Liderar a execução de tarefas' },
    ]);
    expect(blocks.get('leaders')![0]!.code).toBe('5I.3-4');
  });

  it('reads behaviours written as "• código: texto" and joins wrapped lines', () => {
    const { blocks } = parseDivisionBlocks(`Lobitos:
• 4E.1.1: aceita fazer parte da equipa
  e partilha a vez.
• 4S.2.1: diz aos colegas o que fazer.`);
    expect(blocks.get('cub_scouts')).toEqual([
      { code: '4E.1.1', text: 'aceita fazer parte da equipa e partilha a vez.' },
      { code: '4S.2.1', text: 'diz aos colegas o que fazer.' },
    ]);
  });

  it('normalises the Regulamento spelling of codes and reports lines it cannot read', () => {
    const { blocks, unparsed } = parseDivisionBlocks('Caminheiros:\n• 4F1.1 Texto\n• sem código aqui');
    expect(blocks.get('rovers')![0]!.code).toBe('4F.1.1');
    expect(unparsed).toEqual(['• sem código aqui']);
  });

  it('returns nothing for empty cells', () => {
    expect(parseDivisionBlocks('').blocks.size).toBe(0);
    expect(parseDivisionBlocks('-').blocks.size).toBe(0);
  });
});

describe('parseSdgJustifications', () => {
  it('maps each SDG number to its justification', () => {
    const map = parseSdgJustifications('ODS 3: o jogo mantém o corpo ativo.\nODS 17: só se vence em equipa,\ncom entreajuda.');
    expect(map.get(3)).toBe('o jogo mantém o corpo ativo.');
    expect(map.get(17)).toBe('só se vence em equipa, com entreajuda.');
  });

  it('is empty for placeholders', () => {
    expect(parseSdgJustifications('').size).toBe(0);
  });
});

describe('parseChallengeCodes', () => {
  it('reads the codes and ignores the text', () => {
    expect(parseChallengeCodes('EVAS-B - Participa em 3 jogos.\nCC-A - Partilha algo.\nEVAS-B - repetido')).toEqual(['EVAS-B', 'CC-A']);
    expect(parseChallengeCodes('texto livre')).toEqual([]);
  });
});

describe('matchSource', () => {
  const sources = [
    { id: '1', code: 'OSM', name: 'Online Scout Manager' },
    { id: '2', code: 'PESSOAL', name: 'Experiência pessoal' },
  ];

  it('matches by name or code, ignoring case and accents', () => {
    expect(matchSource('online scout manager', sources)?.id).toBe('1');
    expect(matchSource('OSM', sources)?.id).toBe('1');
  });

  it('tolerates a one-letter typo and reports unknown sources as null', () => {
    expect(matchSource('Expriência pessoal', sources)?.id).toBe('2');
    expect(matchSource('Outro sítio', sources)).toBeNull();
    expect(matchSource('', sources)).toBeNull();
  });
});
