/**
 * The description of the Orgo event, built from the program. Orgo shows the description as
 * HTML but keeps only paragraphs, bold, italic, headings, lists, line breaks and links
 * (tables, colours and divs are dropped), and stores the text exactly as sent. So this
 * builder writes only those tags and escapes every stored value itself.
 * Pure: no database, no network.
 */

export type AgeGroupValue = 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders';

export interface DescriptionBlock {
  start: string;
  end: string;
  durationMinutes: number;
  title: string;
}

export interface DescriptionChallenge {
  code: string;
  shortTitle: string;
  /** The division this desafio belongs to. */
  ageGroup: AgeGroupValue;
  /** Mandatory for integration in its division. */
  mandatory: boolean;
  /** Titles of the program blocks whose activity contributes to it. */
  blocks: string[];
  /** Observable behaviours of the linked objectives for that division. */
  behaviours: string[];
}

export interface DescriptionProgram {
  name: string;
  blocks: DescriptionBlock[];
  challenges: DescriptionChallenge[];
}

/** Our own bound. Orgo accepted at least 100,000 characters when tested. */
export const ORGO_DESCRIPTION_MAX_LENGTH = 20_000;

const DIVISION_NAMES: Record<AgeGroupValue, string> = {
  cub_scouts: 'Lobitos',
  scouts: 'Escoteiros',
  adventurers: 'Exploradores',
  rovers: 'Caminheiros',
  leaders: 'Dirigentes',
};

/** Portuguese copy shown inside the Orgo event. Kept together so it can be reviewed in one place. */
const TEXT = {
  intro: (name: string) => `<b>Programa «${name}»</b>, criado no Kit de Atividades.`,
  programHeading: 'Programa',
  challengesHeading: 'Desafios que podem ser assinados',
  challengesNote:
    'Um desafio só pode ser assinado se os comportamentos forem observados durante o programa.',
  mandatory: (division: string) => `Obrigatório para a integração (${division})`,
  blocks: 'Blocos',
  behaviours: 'Comportamentos a observar',
  minutes: 'min',
};

/** Escapes a stored value for HTML text. Nothing from the database is ever written raw. */
export function escapeOrgoHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function programList(blocks: DescriptionBlock[]): string {
  if (blocks.length === 0) return '';
  const items = blocks
    .map(
      (block) =>
        `<li>${escapeOrgoHtml(block.start)}–${escapeOrgoHtml(block.end)} (${block.durationMinutes} ${TEXT.minutes}) · ${escapeOrgoHtml(block.title)}</li>`
    )
    .join('');
  return `<h3>${TEXT.programHeading}</h3><ul>${items}</ul>`;
}

function challengeHeading(challenge: DescriptionChallenge): string {
  const division = DIVISION_NAMES[challenge.ageGroup];
  const title = challenge.shortTitle ? ` · ${escapeOrgoHtml(challenge.shortTitle)}` : '';
  return `<b>${escapeOrgoHtml(challenge.code)}</b>${title} (${division})`;
}

function fullChallenges(challenges: DescriptionChallenge[]): string {
  const parts = challenges.map((challenge) => {
    const lines = [challengeHeading(challenge)];
    if (challenge.mandatory) {
      lines.push(`<i>${TEXT.mandatory(DIVISION_NAMES[challenge.ageGroup])}</i>`);
    }
    if (challenge.blocks.length > 0) {
      lines.push(`${TEXT.blocks}: ${challenge.blocks.map(escapeOrgoHtml).join(', ')}`);
    }
    let html = `<p>${lines.join('<br>')}</p>`;
    if (challenge.behaviours.length > 0) {
      html += `<p>${TEXT.behaviours}:</p><ul>${challenge.behaviours
        .map((behaviour) => `<li>${escapeOrgoHtml(behaviour)}</li>`)
        .join('')}</ul>`;
    }
    return html;
  });
  return `<h3>${TEXT.challengesHeading}</h3><p>${TEXT.challengesNote}</p>${parts.join('')}`;
}

/** Codes and short titles only: used when the full section would make the text too long. */
function shortChallenges(challenges: DescriptionChallenge[]): string {
  const items = challenges
    .map((challenge) => `<li>${challengeHeading(challenge)}${challenge.mandatory ? ' *' : ''}</li>`)
    .join('');
  return `<h3>${TEXT.challengesHeading}</h3><p>${TEXT.challengesNote}</p><ul>${items}</ul>`;
}

/**
 * The event description. The program list always stays complete; when the whole text would be
 * longer than `maxLength` the desafios section is shortened to codes and short titles, and
 * dropped only if even that does not fit.
 */
export function buildOrgoDescription(
  program: DescriptionProgram,
  maxLength: number = ORGO_DESCRIPTION_MAX_LENGTH
): string {
  const head = `<p>${TEXT.intro(escapeOrgoHtml(program.name))}</p>${programList(program.blocks)}`;
  const challenges = [...program.challenges].sort((a, b) => a.code.localeCompare(b.code));
  if (challenges.length === 0) return head;

  const full = head + fullChallenges(challenges);
  if (full.length <= maxLength) return full;
  const short = head + shortChallenges(challenges);
  if (short.length <= maxLength) return short;
  return head;
}
