// Picks a scene for an activity from its text and format, for the activities that have no hand-made scene.
// The choice is rule-based (keywords first, then the format) and varied by a hash of the sheet id.
import * as L from './lib.mjs'
import * as E from './engines.mjs'
import { duel, blind } from './catalog-sheet.mjs'
const { person } = L
const { PROPS, relay, circleScene, table, chain, trail, groupHold, blindGuide, chase, build, converge, hideSeek, custom } = E

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
const has = (text, words) => words.some((w) => text.includes(w))
const pick = (arr, h) => arr[h % arr.length]

/** A short label for the speech bubble: the first word of the name that fits, else "!". */
export function label(name) {
  const words = name.replace(/[^\p{L}\p{N}' -]/gu, ' ').split(/\s+/).filter((w) => w.length > 2)
  const word = words.filter((w) => w.length <= 10).sort((p, q) => q.length - p.length)[0] ?? '!'
  return word.replace(/&/g, 'e').replace(/</g, '')
}

const PROP_WORDS = [
  [['bola', 'bolas', 'bolinha'], 'ball'], [['corda', 'cordel', 'laco', 'nó', 'no '], 'rope'], [['balde', 'agua', 'esponja'], 'bucket'],
  [['bordao', 'pau', 'varas', 'estaca'], 'stick'], [['lenco', 'jornal', 'lona', 'tenda', 'folha'], 'sheet'], [['carta', 'cartao', 'cartas', 'cartoes'], 'card'],
  [['mochila', 'saco', 'saquinho'], 'bag'], [['lata', 'latas'], 'can'], [['papel', 'bilhete', 'mensagem', 'nota'], 'note'], [['balao', 'baloes'], 'balloon'],
  [['mapa', 'bussola', 'orienta'], 'map'], [['frasco', 'copo', 'garrafa'], 'cup'], [['ramo', 'ramos', 'lenha', 'madeira'], 'branch'],
]
const propFor = (text, fallback) => (PROP_WORDS.find(([words]) => has(text, words)) ?? [null, fallback])[1]

export function sceneFor(a) {
  const text = norm(`${a.name} ${a.desc ?? ''}`)
  const name = norm(a.name)
  const h = hash(a.id)
  const bub = label(a.name)
  const item = propFor(text, 'ball')
  const tableItem = has(text, ['grelha', 'tabuleiro', 'quadricula', 'damas']) ? 'grid' : has(text, ['carta', 'cartao', 'cartas']) ? 'card' : has(text, ['desenh', 'papel', 'escrev', 'folha']) ? 'paper' : 'note'

  // blindfold
  if (has(text, ['vendad', 'olhos fechados', 'de olhos vendados', 'as cegas'])) {
    return has(text, ['roda', 'circulo'])
      ? () => circleScene({ n: 6 + (h % 3), centre: (x, y) => { const p = person({ x, foot: y + 110, s: 0.7, pose: 'hold' }); blind(p, 0.7) }, speak: bub })
      : () => blindGuide({ guides: 1 + (h % 2), obstacles: 1 + (h % 3), whistle: h % 4 === 0, bub })
  }
  // races and relays
  if (has(name, ['estafeta', 'corrida', 'raide']) || has(text, ['estafeta', 'corrida'])) {
    return () => relay({ prop: item, end: pick(['cone', 'flag', 'bucket', 'person'], h), lanes: 1 + (h % 2), wait: 2 + (h % 2), bub })
  }
  // hiding and searching
  if (has(text, ['esconde', 'escondid', 'procura', 'procurar', 'encontra'])) {
    return () => hideSeek({ hiders: h % 4, seekers: 1 + (h % 2), objects: pick([null, item === 'ball' ? 'card' : item], h), bub })
  }
  // trails and orientation
  if (has(text, ['percurso', 'pista', 'trilho', 'rumo', 'orienta', 'caminhada', 'rasto', 'itinerario'])) {
    return () => trail({ stops: 3 + (h % 2), walkers: 2 + (h % 2), things: pick(['flag', 'sign', 'stone', 'tree'], h), bub })
  }
  // building and technique
  if (has(text, ['constr', 'tenda', 'torre', 'ponte', 'jangada', 'amarr', 'nos ', 'montar', 'monta'])) {
    return () => build({ structure: pick(['tripod', 'cans', 'planks', 'chariot'], h), n: 3 + (h % 3), bub })
  }
  if (has(text, ['maca', 'socorro', 'ferido', 'primeiros socorros'])) return () => build({ structure: 'stretcher', n: 3, bub })
  // contests and tugging
  if (has(text, ['puxa', 'tracao']) && has(text, ['corda'])) return () => groupHold({ thing: 'rope', n: 5 + (h % 3), pose: 'bend', bub })
  if (has(text, ['empurr', 'duelo', 'luta', 'equilibr', 'desequilibr', 'braco de ferro'])) return () => duel({ pose: pick(['reach', 'ready', 'crouch'], h), bub })
  // tag and chase
  if (has(text, ['apanha', 'persegu', 'foge', 'fuga', 'caca ', 'apanhad', 'tocar', 'toca '])) {
    return () => chase({ chaser: 'run', runners: 2 + (h % 3), markers: pick(['cone', null], h), bub })
  }
  // two teams crossing / taking over
  if (has(text, ['duas equipas', 'campo adversario', 'conquist', 'bandeira', 'invad'])) return () => converge({ arrows: h % 3 !== 0, blockers: 1 + (h % 3), bub })
  // writing, drawing, cards, discussion on a table
  if (has(text, ['desenh', 'escrev', 'cartao', 'cartas', 'papel', 'ideia', 'reflet', 'discut', 'debate', 'pergunta', 'quiz', 'puzzle', 'tabuleiro', 'quadro', 'post-it', 'registo', 'avali'])) {
    return () => table({ item: tableItem, people: 2 + (h % 3), count: 2 + (h % 3), bub: true, bubTxt: bub })
  }
  // circles
  if (has(text, ['roda', 'circulo', 'em circulo', 'sentados', 'sentado', 'de maos dadas'])) {
    return () => circleScene({ n: 6 + (h % 4), hands: has(text, ['maos dadas']), poses: pick([['stand'], ['stand', 'point'], ['wave', 'hips', 'stand']], h), notes: a.format === 'reflexao-debriefing', speak: bub })
  }
  // fall back by format
  switch (a.format) {
    case 'reflexao-debriefing':
      return () => circleScene({ n: 5 + (h % 4), notes: true, poses: ['stand', 'point', 'hold'], speak: bub })
    case 'quebra-gelo':
      return () => circleScene({ n: 6 + (h % 4), poses: pick([['wave', 'stand'], ['stand', 'hips'], ['cheer', 'stand']], h), speak: bub })
    case 'tecnica-oficina':
      return () => table({ item: pick(['paper', 'bag', 'jar', 'bucket', 'cup'], h), people: 2 + (h % 3), count: 2 + (h % 3), bub: true, bubTxt: bub })
    case 'expressao-criativa':
      return () => table({ item: pick(['paper', 'note', 'card'], h), people: 3, count: 3, bub: true, bubTxt: bub })
    case 'desafio-iniciativa':
      return () => build({ structure: pick(['tripod', 'planks', 'chariot'], h), n: 3 + (h % 3), bub })
    case 'aventura-percurso':
      return () => trail({ stops: 4, walkers: 3, things: pick(['flag', 'tree', 'sign'], h), bub })
    case 'energizante':
      return () => chase({ chaser: 'run', runners: 3, markers: 'cone', bub })
    default:
      return pick(
        [
          () => relay({ prop: item, end: 'cone', lanes: 2, bub }),
          () => chase({ chaser: 'run', runners: 2 + (h % 3), markers: 'cone', bub }),
          () => circleScene({ n: 6 + (h % 4), runner: h % 2 === 0, speak: bub }),
          () => converge({ arrows: true, blockers: 1 + (h % 3), bub }),
          () => chain({ n: 4 + (h % 3), link: pick(['waist', 'hands'], h), bub }),
          () => hideSeek({ hiders: 1 + (h % 3), seekers: 1 + (h % 2), objects: null, bub }),
        ],
        h
      )
  }
}

export const fallback = (a) => () => circleScene({ n: 6, speak: label(a.name) })
