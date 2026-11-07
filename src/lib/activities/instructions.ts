/**
 * Renders the plain-text instructions of an activity with structure, without changing
 * the stored text. Recognised section headings (a line containing only the title,
 * ignoring case and accents): Preparação, Desenvolvimento, Fecho e debriefing.
 * Lines starting with "n." form an ordered list.
 */
export type InstructionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'steps'; items: string[] };

export interface InstructionSection {
  /** Null for text before the first recognised heading (or when there is none). */
  title: string | null;
  blocks: InstructionBlock[];
}

const HEADINGS: Record<string, string> = {
  preparacao: 'Preparação',
  desenvolvimento: 'Desenvolvimento',
  'fecho e debriefing': 'Fecho e debriefing',
};

function normalise(line: string): string {
  return line
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[:.]+$/, '');
}

const STEP = /^\s*(\d+)[.)]\s+(.*)$/;

export function parseInstructions(text: string | null | undefined): InstructionSection[] {
  if (!text || !text.trim()) return [];
  const sections: InstructionSection[] = [];
  let current: InstructionSection = { title: null, blocks: [] };
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      current.blocks.push({ type: 'paragraph', text: paragraph.join(' ').trim() });
      paragraph = [];
    }
  };
  const pushSection = () => {
    flushParagraph();
    if (current.title !== null || current.blocks.length > 0) sections.push(current);
  };

  for (const raw of text.replace(/\r\n/g, '\n').split('\n')) {
    const heading = HEADINGS[normalise(raw)];
    if (heading && raw.trim().length <= heading.length + 2) {
      pushSection();
      current = { title: heading, blocks: [] };
      continue;
    }
    const step = STEP.exec(raw);
    if (step) {
      flushParagraph();
      const last = current.blocks[current.blocks.length - 1];
      if (last && last.type === 'steps') last.items.push(step[2]!.trim());
      else current.blocks.push({ type: 'steps', items: [step[2]!.trim()] });
      continue;
    }
    if (!raw.trim()) {
      flushParagraph();
      continue;
    }
    // A wrapped continuation line belongs to the previous step.
    const last = current.blocks[current.blocks.length - 1];
    if (paragraph.length === 0 && last && last.type === 'steps' && /^\s+/.test(raw)) {
      last.items[last.items.length - 1] += ` ${raw.trim()}`;
      continue;
    }
    paragraph.push(raw.trim());
  }
  pushSection();
  return sections;
}
