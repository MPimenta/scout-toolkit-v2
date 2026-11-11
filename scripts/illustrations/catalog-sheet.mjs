// Scenes for sheet activities, keyed by sheet id (ATV-xxxx). Each one assembles the stick-figure kit.
import * as L from './lib.mjs'
import * as E from './engines.mjs'
const { person, ground, cone, flag, scarf, tree, arrow, wavy, stone, line, raw, text, TINT, INK, bubble, bubbleWide, rays } = L
const { PROPS, relay, circleScene, table, chain, groupHold, blindGuide, chase, build, converge, hideSeek, custom } = E
const rect = (x, y, w, h, fill = '#fff', sw = 4) => raw(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`)
const ell = (cx, cy, rx, ry, fill = '#fff', w = 4) => raw(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${w}"/>`)
const blind = (p, s = 1) => line(p.x - 24 * s, p.head - 2, p.x + 24 * s, p.head - 2, 9)

// two people face to face, optionally on low benches, something between them
function duel({ bench = false, between, bub = '!', pose = 'reach' }) {
  ground(850)
  const lift = bench ? 70 : 0
  if (bench) { rect(380, 800 - lift, 170, lift, '#fff', 5); rect(650, 800 - lift, 170, lift, '#fff', 5) }
  person({ x: 470, foot: 800 - lift, s: 1.0, pose, team: 'a' })
  person({ x: 740, foot: 800 - lift, s: 1.0, pose, flip: true, team: 'b' })
  if (between) between()
  rays(400, 560 - lift, 34, 3, 30, 190); rays(820, 560 - lift, 34, 3, 30, -10)
  bubble(600, 250, bub)
}
// people on the left throw at a wall on the right
function wall({ people = 3, bub = '!' }) {
  ground(850)
  rect(900, 250, 60, 600, '#fff', 5)
  for (let i = 0; i < people; i++) person({ x: 150 + i * 230, foot: 800, s: 0.95, pose: 'reach', team: i % 2 ? 'b' : 'a' })
  arrow(520, 520, 840, 480)
  bubble(560, 300, bub)
}
// two rows facing each other, one person walking between them
function lines({ bub = '?' }) {
  ground(850); ground(600, 30, 1170, 0.2)
  for (const [x, f, k] of [[250, 800, 0], [250, 600, 1]]) for (let i = 0; i < 2; i++) person({ x: x + i * 130, foot: f, s: k ? 0.7 : 0.95, pose: 'stand', team: 'a' })
  for (const [x, f, k] of [[1050, 800, 0], [1050, 600, 1]]) for (let i = 0; i < 2; i++) person({ x: x - i * 130, foot: f, s: k ? 0.7 : 0.95, pose: 'stand', flip: true, team: 'b' })
  person({ x: 650, foot: 760, s: 0.95, pose: 'walk', team: 'a' })
  bubble(650, 300, bub)
}
// a pole held low at both ends, one person jumping it
function pole({ bub = '!' } = {}) {
  ground(850)
  person({ x: 160, foot: 800, s: 0.9, pose: 'crouch', team: 'b' }); person({ x: 1040, foot: 800, s: 0.9, pose: 'crouch', flip: true, team: 'b' })
  line(200, 740, 990, 740, 7)
  person({ x: 520, foot: 640, s: 0.95, pose: 'armsUp', team: 'a' })
  person({ x: 340, foot: 800, s: 0.95, pose: 'stand', team: 'a' }); person({ x: 760, foot: 800, s: 0.95, pose: 'stand', team: 'a' })
  rays(520, 760, 30, 3, 30, 90)
  bubble(760, 330, bub)
}
// three people pulling a ring of rope, each towards their own flag
function tugThree() {
  ground(850)
  ell(600, 640, 150, 52, 'none', 6)
  ;[[250, 800, false], [950, 800, true], [600, 560, false]].forEach(([x, f, flip], i) => {
    person({ x, foot: f, s: i === 2 ? 0.7 : 0.95, pose: 'bend', flip, team: i % 2 ? 'b' : 'a' })
  })
  flag(110, 830, true, 120); flag(1100, 830, true, 120); flag(600, 480, true, 90)
  rays(180, 700, 30, 3, 30, 190); rays(1010, 700, 30, 3, 30, -10)
}
// a net with a balloon over it, pairs holding a sheet on each side
function net() {
  ground(850)
  line(600, 420, 600, 820, 7); line(60, 520, 1140, 520, 5)
  for (let x = 100; x < 1100; x += 110) line(x, 520, x + 6, 600, 2.5)
  ;[[260, 'a', false], [940, 'b', true]].forEach(([x, t, f]) => {
    person({ x: x - 70, foot: 800, s: 0.9, pose: 'reach', team: t, flip: f }); person({ x: x + 70, foot: 800, s: 0.9, pose: 'reach', team: t, flip: f })
    raw(`<path d="M${x - 90} 690 L${x + 90} 690 L${x + 60} 720 L${x - 60} 720 Z" fill="${TINT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)
  })
  PROPS.balloon(600, 280, 1.4); arrow(420, 330, 560, 280)
  bubble(760, 300, '!')
}
function raft() {
  ground(880)
  wavy(30, 1170, 700, 10, 40); wavy(30, 1170, 790, 10, 40)
  rect(300, 640, 520, 36, TINT, 5); line(330, 676, 330, 700, 5); line(790, 676, 790, 700, 5)
  ;[400, 540, 680].forEach((x, i) => { const p = person({ x, foot: 650, s: 0.78, pose: 'reach', team: i % 2 ? 'b' : 'a' }); const [hx, hy] = p.hand('r'); line(hx - 10, hy - 20, hx + 30, hy + 90, 5) })
  flag(1040, 720, true, 120); bubble(520, 320, '!')
}
function litter() {
  ground(850); tree(1000, 800, 1.1)
  ;[240, 520, 790].forEach((x, i) => { person({ x, foot: 800, s: 0.95, pose: 'bend', team: i % 2 ? 'b' : 'a' }); stone(x + 70, 790, 30); PROPS.bag(x - 20, 700, 0.8) })
  PROPS.bucket(1090, 770, 1.1); bubble(600, 300, 'lixo')
}
function treeBlind() {
  ground(850); tree(780, 820, 1.7)
  const b = person({ x: 540, foot: 800, s: 1.0, pose: 'reach', team: 'b' }); blind(b)
  person({ x: 300, foot: 800, s: 0.95, pose: 'point', team: 'a' })
  bubble(560, 300, '?')
}
function speakers() {
  ground(850)
  ;[[330, false], [870, true]].forEach(([x, f], i) => { person({ x, foot: 800, s: 1.0, pose: 'wave', flip: f, team: i ? 'b' : 'a' }) })
  bubbleWide(330, 250, '!!', 60); bubbleWide(870, 250, '??', 60)
  ;[140, 600, 1060].forEach((x, i) => person({ x, foot: 560, s: 0.55, pose: i === 1 ? 'cheer' : 'stand', team: i % 2 ? 'b' : 'a' }))
}
function balloonsWall() {
  ground(850); rect(900, 250, 60, 600, '#fff', 5)
  ;[330, 470, 610].forEach((y) => PROPS.balloon(870, y, 1.1))
  ;[180, 420, 660].forEach((x, i) => { const p = person({ x, foot: 800, s: 0.95, pose: 'reach', team: i % 2 ? 'b' : 'a' }); PROPS.balloon(p.x + 140, p.head + 10, 1) })
  bubble(560, 300, '!')
}

export const scenes = {
  'ATV-0102': () => chase({ chaser: 'run', runners: 4, markers: 'cone', bub: 'caudas!', extra: () => { scarf(700, 600, 1); scarf(820, 760, 1) } }),
  'ATV-0118': () => blindGuide({ guides: 1, obstacles: 2, bub: 'cheira!' }),
  'ATV-0127': () => { ground(850); PROPS.grid(220, 440, 2.4); person({ x: 220, foot: 800, s: 0.95, pose: 'point', team: 'b' }); [620, 800, 980].forEach((x, i) => person({ x, foot: 800 - i * 10, s: 0.8, pose: 'walk', flip: true, team: i % 2 ? 'b' : 'a' })); arrow(560, 700, 460, 700); bubble(620, 300, '?') },
  'ATV-0135': () => table({ item: 'grid', people: 2, count: 3, bub: true, bubTxt: '2 min' }),
  'ATV-0145': () => duel({ between: () => PROPS.ballT(600, 560, 1.6), bub: 'meu!' }),
  'ATV-0154': () => duel({ bench: true, between: () => line(500, 520, 700, 520, 12), bub: 'ui!' }),
  'ATV-0171': () => circleScene({ n: 8, poses: ['armsUp', 'stand', 'cheer'], centre: (x, y) => { PROPS.rope(x, y + 60, 3); person({ x, foot: y + 110, s: 0.6, pose: 'hold' }) }, speak: 'salta!' }),
  'ATV-0187': () => custom.fourCorners(),
  'ATV-0196': () => relay({ prop: 'bag', end: 'person', bub: 'mochila!' }),
  'ATV-0204': balloonsWall,
  'ATV-0212': () => relay({ prop: 'ball', end: 'cone', lanes: 1, wait: 3, bub: 'corre!' }),
  'ATV-0221': () => blindGuide({ guides: 2, obstacles: 1, whistle: true, bub: '?' }),
  'ATV-0229': () => build({ structure: 'cans', n: 4, bub: '4' }),
  'ATV-0238': () => chain({ n: 5, link: 'ankles', bub: 'juntos!' }),
  'ATV-0246': () => custom.stakes(),
  'ATV-0254': () => chase({ chaser: 'run', runners: 3, markers: 'bucket', bub: 'água!' }),
  'ATV-0262': speakers,
  'ATV-0272': () => circleScene({ n: 8, hands: true, runner: true, speak: 'foge!' }),
  'ATV-0281': () => relay({ prop: 'stick', end: 'person', bub: 'apara!' }),
  'ATV-0289': pole,
  'ATV-0297': () => table({ item: 'card', people: 3, count: 6, bub: true, bubTxt: '30"' }),
  'ATV-0306': () => relay({ prop: 'cup', end: 'basket', bub: '3 €' }),
  'ATV-0315': () => relay({ prop: 'ball', end: 'bucket', lanes: 2, bub: 'moeda!' }),
  'ATV-0323': () => custom.backToBack(),
  'ATV-0331': () => relay({ prop: 'sheet', end: 'flag', bub: 'tenda!' }),
  'ATV-0340': () => converge({ arrows: true, blockers: 3, bub: 'invasor!' }),
  'ATV-0349': () => circleScene({ n: 8, centre: (x, y) => PROPS.can(x, y + 60, 1.6), runner: true, speak: 'ninho!' }),
  'ATV-0357': () => circleScene({ n: 7, poses: ['stand', 'point', 'hips'], speak: 'e no carrinho?' }),
  'ATV-0366': () => circleScene({ n: 8, centre: (x, y) => PROPS.bag(x, y + 60, 1.2), runner: true, speak: 'tesouro!' }),
  'ATV-0374': tugThree,
  'ATV-0383': net,
  'ATV-0393': () => circleScene({ n: 9, poses: ['stand', 'point', 'wave'], speak: 'Zip!' }),
  'ATV-0405': () => table({ item: 'note', people: 4, count: 5, bub: true, bubTxt: '25/10' }),
  'ATV-0429': () => table({ item: 'cup', people: 2, count: 1, bub: true, bubTxt: 'bem!' }),
  'ATV-0439': () => table({ item: 'card', people: 2, count: 2, bub: true, bubTxt: 'pum!' }),
  'ATV-0448': () => circleScene({ n: 6, notes: true, poses: ['stand', 'point', 'hold'], speak: '3-2-1' }),
  'ATV-0461': treeBlind,
  'ATV-0477': () => table({ item: 'bag', people: 3, count: 4, bub: true, bubTxt: '+' }),
  'ATV-0500': litter,
  'ATV-0526': raft,
  'ATV-0540': () => build({ structure: 'cans', n: 3, bub: '3 m' }),
  'ATV-0548': () => groupHold({ thing: 'rope', n: 6, pose: 'bend', bub: 'puxa!' }),
  'ATV-0556': () => circleScene({ n: 7, poses: ['armsUp', 'cheer', 'hips', 'ready', 'point', 'wave', 'reach'], speak: '1, 2, 3!' }),
  'ATV-0564': () => custom.armWrestle(),
  'ATV-0572': () => hideSeek({ hiders: 3, seekers: 1, objects: null, bub: '10…' }),
  'ATV-0580': () => lines({ bub: '?' }),
  'ATV-0588': () => circleScene({ n: 8, hands: true, runner: true, speak: 'miau!' }),
  'ATV-0596': () => { chain({ n: 4, link: 'hands', pose: 'run', bub: '!' }); person({ x: 1030, foot: 800, s: 0.95, pose: 'run', flip: true, team: 'b' }) },
  'ATV-0604': () => wall({ people: 3, bub: '7' }),
  'ATV-0612': () => converge({ arrows: true, blockers: 2, bub: 'cevada!' }),
}

export { duel, blind, rect, ell, lines, speakers }
