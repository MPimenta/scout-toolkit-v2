import { describe, expect, it } from 'vitest';
import { parseInstructions } from '@/lib/activities/instructions';

const structured = `Preparação
Marcar o campo com cones.
Dividir em duas equipas.

Desenvolvimento
1. Cada equipa fica no seu lado.
2. Ao sinal, tentam atravessar a linha
   central e voltar.
3. Quem for tocado vai para a prisão.

Fecho e debriefing
Sentar em roda 5 minutos: que estratégia usámos?`;

describe('parseInstructions', () => {
  it('splits the three headings into titled sections', () => {
    const sections = parseInstructions(structured);
    expect(sections.map((s) => s.title)).toEqual(['Preparação', 'Desenvolvimento', 'Fecho e debriefing']);
    expect(sections[0]!.blocks).toEqual([{ type: 'paragraph', text: 'Marcar o campo com cones. Dividir em duas equipas.' }]);
  });

  it('builds an ordered list and joins wrapped step lines', () => {
    const steps = parseInstructions(structured)[1]!.blocks[0]!;
    expect(steps).toEqual({
      type: 'steps',
      items: [
        'Cada equipa fica no seu lado.',
        'Ao sinal, tentam atravessar a linha central e voltar.',
        'Quem for tocado vai para a prisão.',
      ],
    });
  });

  it('ignores case, accents and a trailing colon in headings', () => {
    const sections = parseInstructions('PREPARACAO:\nTexto\n\nfecho e DEBRIEFING\nMais texto');
    expect(sections.map((s) => s.title)).toEqual(['Preparação', 'Fecho e debriefing']);
  });

  it('renders text without headings as untitled paragraphs, unchanged', () => {
    const sections = parseInstructions('Primeiro parágrafo.\n\nSegundo parágrafo.');
    expect(sections).toEqual([
      { title: null, blocks: [{ type: 'paragraph', text: 'Primeiro parágrafo.' }, { type: 'paragraph', text: 'Segundo parágrafo.' }] },
    ]);
  });

  it('keeps text before the first heading as an untitled section', () => {
    const sections = parseInstructions('Introdução.\nDesenvolvimento\n1. Passo');
    expect(sections.map((s) => s.title)).toEqual([null, 'Desenvolvimento']);
  });

  it('does not treat a sentence that merely contains a heading word as a heading', () => {
    const sections = parseInstructions('A preparação demora 5 minutos.');
    expect(sections[0]!.title).toBeNull();
  });

  it('returns nothing for empty input', () => {
    expect(parseInstructions('')).toEqual([]);
    expect(parseInstructions(null)).toEqual([]);
    expect(parseInstructions('  \n ')).toEqual([]);
  });
});
