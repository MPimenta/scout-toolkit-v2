// Second batch of sheet scenes (keyed by sheet id). See catalog-sheet.mjs for the first batch and helpers.
import * as L from './lib.mjs'
import * as E from './engines.mjs'
import { duel, blind, rect, speakers, lines } from './catalog-sheet.mjs'
const { person, ground, flag, arrow, line, raw, bubble, bubbleWide, rays, compass, INK } = L
const { PROPS, relay, circleScene, table, chain, trail, groupHold, blindGuide, chase, build, converge, hideSeek, custom } = E

// a person stands blindfolded in the middle of a ring
const blindCentre = (x, y) => { const p = person({ x, foot: y + 110, s: 0.7, pose: 'hold' }); blind(p, 0.7) }

function ticTacToe() {
  ground(850)
  for (const x of [470, 600]) line(x - 40, 300, x - 40, 620, 6)
  for (const y of [410, 520]) line(330, y, 740, y, 6)
  ;[[385, 355], [515, 465], [645, 575]].forEach(([x, y]) => L.circle(x, y, 22, 5, '#fff'))
  person({ x: 150, foot: 800, s: 0.95, pose: 'run', team: 'a' }); person({ x: 1000, foot: 800, s: 0.95, pose: 'run', flip: true, team: 'b' })
  PROPS.ball(240, 690, 0.9); bubble(600, 220, '!')
}
function horseshoe() {
  ground(850)
  const p = person({ x: 300, foot: 800, s: 1.0, pose: 'reach', team: 'a' })
  PROPS.stake(900, 800, 1.2); arrow(430, 600, 840, 700)
  person({ x: 160, foot: 560, s: 0.6, pose: 'stand', team: 'b' })
  bubble(560, 330, '!')
  return p
}
function bowling() {
  ground(850)
  ;[[900, 520], [850, 590], [950, 590], [800, 660], [900, 660], [1000, 660]].forEach(([x, y]) => PROPS.bottle(x, y, 0.8))
  person({ x: 250, foot: 800, s: 1.0, pose: 'bend', team: 'a' }); PROPS.ball(480, 780, 1.1); arrow(520, 740, 760, 690)
  bubble(560, 330, '9')
}
function morse() {
  ground(850)
  person({ x: 220, foot: 800, s: 1.0, pose: 'point', team: 'a' }); person({ x: 980, foot: 800, s: 1.0, pose: 'point', flip: true, team: 'b' })
  rays(380, 640, 40, 4, 25, -10); rays(840, 640, 40, 4, 25, 190)
  bubbleWide(300, 330, '· – ·', 70); bubbleWide(900, 330, '– · ·', 70)
}
function chairs() {
  ground(860, 60, 1140, 0.25)
  circleScene({ n: 8, speak: 'para!' })
  ;[[440, 640], [600, 600], [760, 640], [500, 720], [700, 720]].forEach(([x, y]) => { rect(x - 20, y - 24, 40, 34, '#fff', 4); line(x - 20, y - 24, x - 20, y - 56, 4) })
}

export const scenes = {
  'ATV-0103': () => circleScene({ n: 8, poses: ['hold', 'point'], centre: (x, y) => L.compass(x, y + 60, 44), speak: 'Norte!' }),
  'ATV-0109': () => hideSeek({ hiders: 1, seekers: 2, objects: null, bub: '?' }),
  'ATV-0117': () => trail({ stops: 4, walkers: 2, things: 'stone', bub: 'lã!' }),
  'ATV-0124': () => hideSeek({ hiders: 0, seekers: 3, objects: 'cup', bub: '?' }),
  'ATV-0130': () => table({ item: 'paper', people: 4, count: 4, bub: true, bubTxt: 'copia!' }),
  'ATV-0136': () => circleScene({ n: 8, poses: ['reach', 'hold'], centre: (x, y) => person({ x, foot: y + 110, s: 0.7, pose: 'armsUp' }), speak: 'confia!' }),
  'ATV-0143': () => duel({ pose: 'crouch', between: () => line(500, 640, 700, 640, 8), bub: 'cai!' }),
  'ATV-0149': () => converge({ arrows: true, blockers: 2, bub: 'bandeira!' }),
  'ATV-0155': () => blindGuide({ guides: 1, obstacles: 0, bub: '+' }),
  'ATV-0162': () => trail({ stops: 3, walkers: 2, things: 'sign', bub: 'torto?' }),
  'ATV-0167': () => trail({ stops: 3, walkers: 2, things: 'tree', lookouts: 2, hide: true, bub: 'psiu' }),
  'ATV-0176': () => build({ structure: 'stretcher', n: 3, bub: '1-2-3' }),
  'ATV-0181': () => converge({ arrows: true, blockers: 3, bub: 'raide!' }),
  'ATV-0186': () => duel({ pose: 'ready', bub: 'upa!' }),
  'ATV-0192': () => trail({ stops: 3, walkers: 2, things: 'tree', bub: 'luz!' }),
  'ATV-0198': () => circleScene({ n: 7, hands: true, speak: 'passa!' }),
  'ATV-0203': () => chase({ chaser: 'run', runners: 2, markers: null, bub: 'balão!', extra: () => PROPS.balloon(700, 430, 1.4) }),
  'ATV-0209': () => relay({ prop: 'stick', end: 'bottle', bub: 'lata!' }),
  'ATV-0215': () => converge({ arrows: true, blockers: 2, bub: 'passa!' }),
  'ATV-0220': () => circleScene({ n: 6, centre: blindCentre, speak: 'canto!' }),
  'ATV-0226': () => chase({ chaser: 'run', runners: 4, markers: 'cone', bub: 'pares!' }),
  'ATV-0233': () => circleScene({ n: 6, poses: ['armsUp', 'hold', 'point'], speak: '?' }),
  'ATV-0239': () => relay({ prop: 'ball', end: 'person', lanes: 2, bub: 'frango!' }),
  'ATV-0244': () => relay({ prop: 'sheet', end: 'flag', lanes: 2, bub: 'jornal!' }),
  'ATV-0250': () => chain({ n: 5, link: 'hands', crouch: true, bub: '+1' }),
  'ATV-0256': () => groupHold({ thing: 'stick', n: 5, pose: 'ready', up: true, bub: 'baixa!' }),
  'ATV-0261': () => table({ item: 'note', people: 3, count: 2, bub: true, bubTxt: 'quem?' }),
  'ATV-0267': () => relay({ prop: 'envelope', end: 'person', bub: '1, 2, 3' }),
  'ATV-0273': () => relay({ prop: 'ball', end: 'hoop', lanes: 1, wait: 2, bub: 'zona!' }),
  'ATV-0278': () => custom.lagarta(),
  'ATV-0284': () => circleScene({ n: 7, centre: blindCentre, speak: 'Bom dia!' }),
  'ATV-0290': () => circleScene({ n: 8, poses: ['point', 'stand'], centre: (x, y) => L.compass(x, y + 60, 44), speak: 'Sul!' }),
  'ATV-0295': () => relay({ prop: 'peg', end: 'stake', bub: 'pancada!' }),
  'ATV-0301': () => table({ item: 'stick', people: 2, count: 5, bub: true, bubTxt: 'último?' }),
  'ATV-0307': () => hideSeek({ hiders: 3, seekers: 2, objects: null, bub: '!' }),
  'ATV-0312': () => circleScene({ n: 8, centre: (x, y) => { person({ x, foot: y + 110, s: 0.7, pose: 'armsUp' }); PROPS.ball(x + 130, y - 10, 1) }, speak: 'bola!' }),
  'ATV-0319': () => trail({ stops: 3, walkers: 3, things: 'tree', bub: 'desenha!' }),
  'ATV-0325': () => duel({ pose: 'ready', bub: 'empurra!' }),
  'ATV-0330': () => chase({ chaser: 'run', runners: 2, markers: 'cone', bub: 'pinos!' }),
  'ATV-0336': () => relay({ prop: 'ball', end: 'person', lanes: 2, bub: 'qual?' }),
  'ATV-0343': () => hideSeek({ hiders: 0, seekers: 3, objects: 'paper', bub: 'comida!' }),
  'ATV-0348': () => hideSeek({ hiders: 4, seekers: 1, objects: null, bub: 'sh!' }),
  'ATV-0354': () => relay({ prop: 'note', end: 'person', bub: 'psiu…' }),
  'ATV-0360': () => circleScene({ n: 7, poses: ['wave', 'cheer', 'stand'], speak: ':)' }),
  'ATV-0365': () => relay({ prop: 'stick', end: 'person', lanes: 2, wait: 3, bub: 'passa!' }),
  'ATV-0371': () => chase({ chaser: 'run', runners: 4, markers: 'cone', bub: 'ladrão!' }),
  'ATV-0377': () => trail({ stops: 3, walkers: 3, things: 'stone', bub: 'bolinhas' }),
  'ATV-0382': () => lines({ bub: 'maior!' }),
  'ATV-0388': () => circleScene({ n: 8, centre: (x, y) => { person({ x, foot: y + 110, s: 0.7, pose: 'reach' }); PROPS.ball(x - 100, y - 10, 1) }, speak: 'quem?' }),
  'ATV-0394': () => table({ item: 'note', people: 4, count: 4, bub: true, bubTxt: '1-2-4' }),
  'ATV-0401': () => table({ item: 'note', people: 3, count: 0, bub: true, bubTxt: 'ideias!' }),
  'ATV-0408': speakers,
  'ATV-0419': () => circleScene({ n: 5, stars: true, speak: '4 eixos' }),
  'ATV-0431': () => table({ item: 'grid', people: 4, count: 3, bub: true, bubTxt: '10' }),
  'ATV-0438': () => circleScene({ n: 7, centre: blindCentre, speak: 'psiu' }),
  'ATV-0444': () => table({ item: 'card', people: 4, count: 4, bub: true, bubTxt: 'puzzle' }),
  'ATV-0453': () => circleScene({ n: 6, centre: (x, y) => { PROPS.ball(x, y + 60, 1.2); PROPS.rope(x + 90, y + 70, 1) }, speak: 'novo jogo!' }),
  'ATV-0459': () => blindGuide({ guides: 2, obstacles: 3, bub: 'cuidado' }),
  'ATV-0465': morse,
  'ATV-0471': () => table({ item: 'jar', people: 3, count: 3, bub: true, bubTxt: 'valores' }),
  'ATV-0480': () => circleScene({ n: 7, centre: (x, y) => person({ x, foot: y + 110, s: 0.7, pose: 'bend' }), speak: 'cuidado' }),
  'ATV-0492': () => relay({ prop: 'map', end: 'cone', lanes: 1, wait: 2, bub: 'cones' }),
  'ATV-0497': () => table({ item: 'note', people: 2, count: 3, bub: true, bubTxt: 'bem' }),
  'ATV-0510': () => table({ item: 'bucket', people: 3, count: 2, bub: true, bubTxt: 'lama!' }),
  'ATV-0523': ticTacToe,
  'ATV-0533': () => table({ item: 'bag', people: 3, count: 3, bub: true, bubTxt: 'rrr!' }),
  'ATV-0538': chairs,
  'ATV-0544': () => relay({ prop: 'rope', end: 'cone', lanes: 2, bub: 'arco!' }),
  'ATV-0550': horseshoe,
  'ATV-0555': () => converge({ arrows: false, blockers: 0, bub: 'Dia!' }),
  'ATV-0561': () => circleScene({ n: 6, poses: ['point', 'hold'], speak: 'quero!' }),
  'ATV-0567': () => relay({ prop: 'ball', end: 'flag', lanes: 1, wait: 3, pose: 'armsUp', bub: 'bola!' }),
  'ATV-0573': () => chase({ chaser: 'run', runners: 3, markers: 'cone', bub: 'coito!' }),
  'ATV-0578': bowling,
  'ATV-0584': () => circleScene({ n: 8, hands: true, speak: 'aperto!' }),
}
