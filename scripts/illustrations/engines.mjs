import * as L from './lib.mjs'
const { person, bubbleWide, ground, cone, flag, scarf, tree, star, arrow, wavy, stone, fish, spider, bug, flame, compass, sticks, rays, line, stroke, circle, raw, text, TINT, INK, FOOT } = L
const bubble = (x, y, t) => (String(t).length <= 2 ? L.bubble(x, y, t) : bubbleWide(x, y, t, Math.min(300, 28 + String(t).length * 9)))

const ell = (cx, cy, rx, ry, fill = '#fff', w = 4) =>
  raw(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${w}"/>`)
const rect = (x, y, w, h, fill = '#fff', sw = 4, r = 0) =>
  raw(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`)
const poly = (pts, fill = '#fff', sw = 4) =>
  raw(`<path d="M${pts.map((p) => p.join(' ')).join(' L')} Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`)

/* ---------- props (drawn at x,y with scale k) ---------- */
export const PROPS = {
  ball: (x, y, k = 1) => circle(x, y, 16 * k, 4, '#fff'),
  ballT: (x, y, k = 1) => { circle(x, y, 16 * k, 4, TINT); stroke(`M${x - 16 * k} ${y} q${16 * k} ${-10 * k} ${32 * k} 0`, 3) },
  rope: (x, y, k = 1) => stroke(`M${x - 30 * k} ${y} q${15 * k} ${-26 * k} ${30 * k} 0 t${30 * k} 0 t${30 * k} 0`, 5),
  stick: (x, y, k = 1) => line(x - 50 * k, y + 30 * k, x + 50 * k, y - 36 * k, 6),
  can: (x, y, k = 1) => { rect(x - 14 * k, y - 22 * k, 28 * k, 38 * k, '#fff', 4); line(x - 14 * k, y - 10 * k, x + 14 * k, y - 10 * k, 3) },
  plane: (x, y, k = 1) => poly([[x - 36 * k, y + 8 * k], [x + 38 * k, y - 10 * k], [x - 6 * k, y + 22 * k]], TINT, 3.5),
  balloon: (x, y, k = 1) => { ell(x, y, 17 * k, 22 * k, TINT, 4); line(x, y + 22 * k, x - 4 * k, y + 46 * k, 3) },
  card: (x, y, k = 1) => rect(x - 18 * k, y - 26 * k, 36 * k, 52 * k, '#fff', 4, 4),
  paper: (x, y, k = 1) => { rect(x - 24 * k, y - 30 * k, 48 * k, 60 * k, '#fff', 4); for (let i = 0; i < 3; i++) line(x - 14 * k, y - 14 * k + i * 14 * k, x + 14 * k, y - 14 * k + i * 14 * k, 2.5) },
  jar: (x, y, k = 1) => { rect(x - 16 * k, y - 24 * k, 32 * k, 40 * k, '#fff', 4, 6); rect(x - 12 * k, y - 32 * k, 24 * k, 10 * k, TINT, 3) },
  bucket: (x, y, k = 1) => { poly([[x - 28 * k, y - 30 * k], [x + 28 * k, y - 30 * k], [x + 20 * k, y + 22 * k], [x - 20 * k, y + 22 * k]], '#fff', 4); wavy(x - 26 * k, x + 26 * k, y - 22 * k, 4, 18) },
  cup: (x, y, k = 1) => { poly([[x - 14 * k, y - 18 * k], [x + 14 * k, y - 18 * k], [x + 9 * k, y + 14 * k], [x - 9 * k, y + 14 * k]], '#fff', 3.5); star(x, y + 34 * k, 5) },
  bottle: (x, y, k = 1) => { poly([[x - 14 * k, y - 10 * k], [x + 14 * k, y - 10 * k], [x + 14 * k, y + 40 * k], [x - 14 * k, y + 40 * k]], '#fff', 4); rect(x - 6 * k, y - 34 * k, 12 * k, 24 * k, '#fff', 4) },
  bag: (x, y, k = 1) => { ell(x, y, 46 * k, 20 * k, TINT, 4); line(x - 40 * k, y, x + 40 * k, y, 3) },
  feather: (x, y, k = 1) => { stroke(`M${x - 40 * k} ${y + 12 * k} Q${x} ${y - 30 * k} ${x + 42 * k} ${y - 6 * k}`, 4); for (let i = 0; i < 5; i++) line(x - 20 * k + i * 12 * k, y - 8 * k, x - 12 * k + i * 12 * k, y - 22 * k, 3) },
  branch: (x, y, k = 1) => { line(x - 30 * k, y + 20 * k, x + 20 * k, y - 20 * k, 5); for (const [dx, dy] of [[-4, -4], [8, -16], [-16, 6]]) line(x + dx * k, y + dy * k, x + (dx + 22) * k, y + (dy - 12) * k, 3) },
  map: (x, y, k = 1) => { poly([[x - 40 * k, y - 26 * k], [x - 12 * k, y - 20 * k], [x + 16 * k, y - 28 * k], [x + 40 * k, y - 22 * k], [x + 40 * k, y + 26 * k], [x + 16 * k, y + 32 * k], [x - 12 * k, y + 24 * k], [x - 40 * k, y + 30 * k]], '#fff', 4); line(x - 12 * k, y - 20 * k, x - 12 * k, y + 24 * k, 2.5); line(x + 16 * k, y - 28 * k, x + 16 * k, y + 32 * k, 2.5) },
  lashing: (x, y, k = 1) => { line(x - 36 * k, y - 30 * k, x + 36 * k, y + 30 * k, 6); line(x + 36 * k, y - 30 * k, x - 36 * k, y + 30 * k, 6); circle(x, y, 10 * k, 4, TINT) },
  pin: (x, y, k = 1) => { poly([[x - 12 * k, y - 30 * k], [x + 12 * k, y - 30 * k], [x + 10 * k, y + 20 * k], [x - 10 * k, y + 20 * k]], TINT, 4) },
  log: (x, y, k = 1) => { rect(x - 70 * k, y - 20 * k, 140 * k, 40 * k, '#fff', 5, 20 * k); ell(x + 70 * k, y, 10 * k, 20 * k, TINT, 4) },
  broom: (x, y, k = 1) => { line(x - 70 * k, y, x + 60 * k, y, 6); line(x + 60 * k, y, x + 86 * k, y - 12 * k, 4); line(x + 60 * k, y, x + 86 * k, y + 12 * k, 4) },
  sheet: (x, y, k = 1) => poly([[x - 64 * k, y - 10 * k], [x + 56 * k, y - 18 * k], [x + 70 * k, y + 20 * k], [x - 74 * k, y + 28 * k]], TINT, 4),
  peg: (x, y, k = 1) => { rect(x - 6 * k, y - 18 * k, 12 * k, 36 * k, TINT, 3) },
  note: (x, y, k = 1) => { circle(x, y + 14 * k, 8 * k, 4, INK); line(x + 8 * k, y + 14 * k, x + 8 * k, y - 22 * k, 4); line(x + 8 * k, y - 22 * k, x + 24 * k, y - 14 * k, 4) },
  whistle: (x, y, k = 1) => { ell(x, y, 16 * k, 12 * k, '#fff', 4); rect(x + 12 * k, y - 8 * k, 22 * k, 10 * k, '#fff', 3) },
  envelope: (x, y, k = 1) => { rect(x - 24 * k, y - 16 * k, 48 * k, 32 * k, '#fff', 4); line(x - 24 * k, y - 16 * k, x, y + 4 * k, 3); line(x + 24 * k, y - 16 * k, x, y + 4 * k, 3) },
  magnifier: (x, y, k = 1) => { circle(x, y, 18 * k, 4, '#fff'); line(x + 13 * k, y + 13 * k, x + 36 * k, y + 36 * k, 6) },
  footprint: (x, y, k = 1) => { ell(x, y, 12 * k, 16 * k, '#fff', 3.5); for (const dx of [-14, -5, 5, 14]) circle(x + dx * k, y - 26 * k, 4 * k, 3, INK) },
  clock: (x, y, k = 1) => { circle(x, y, 40 * k, 5, '#fff'); line(x, y, x, y - 26 * k, 4); line(x, y, x + 18 * k, y + 8 * k, 4) },
  sign: (x, y, k = 1, t = 'A') => { line(x, y + 40 * k, x, y - 20 * k, 5); rect(x - 26 * k, y - 62 * k, 52 * k, 44 * k, '#fff', 4); text(x, y - 28 * k, t, 30 * k) },
  stake: (x, y, k = 1) => { line(x, y, x, y - 70 * k, 6); poly([[x - 8 * k, y - 70 * k], [x, y - 84 * k], [x + 8 * k, y - 70 * k]], '#fff', 3) },
  buzzer: (x, y, k = 1) => { ell(x, y, 22 * k, 10 * k, '#fff', 4); rect(x - 10 * k, y - 22 * k, 20 * k, 14 * k, TINT, 3, 4) },
  hornsBox: (x, y, k = 1) => { rect(x - 46 * k, y - 60 * k, 92 * k, 100 * k, '#fff', 5); line(x - 40 * k, y - 62 * k, x - 66 * k, y - 96 * k, 5); line(x + 40 * k, y - 62 * k, x + 66 * k, y - 96 * k, 5) },
  grid: (x, y, k = 1) => { rect(x - 50 * k, y - 50 * k, 100 * k, 100 * k, '#fff', 4); for (let i = 1; i < 4; i++) { line(x - 50 * k + i * 25 * k, y - 50 * k, x - 50 * k + i * 25 * k, y + 50 * k, 2.5); line(x - 50 * k, y - 50 * k + i * 25 * k, x + 50 * k, y - 50 * k + i * 25 * k, 2.5) } circle(x - 12 * k, y + 12 * k, 5 * k, 3, INK) },
  plane2: (x, y, k = 1) => PROPS.plane(x, y, k),
  bigKnot: (x, y, k = 1) => { stroke(`M${x - 90 * k} ${y + 30 * k} C${x - 20 * k} ${y - 60 * k} ${x + 40 * k} ${y + 60 * k} ${x + 90 * k} ${y - 30 * k}`, 12 * Math.min(k, 1)); stroke(`M${x - 60 * k} ${y - 20 * k} C${x} ${y + 50 * k} ${x + 30 * k} ${y - 40 * k} ${x + 80 * k} ${y + 20 * k}`, 12 * Math.min(k, 1)) },
}
const prop = (name, x, y, k = 1, t) => (PROPS[name] || PROPS.ball)(x, y, k, t)

/* ---------- helpers ---------- */
const lying = (x, y, s = 1, { up = false, team = 'a' } = {}) => {
  // a person lying on their back: head at left, body to the right
  circle(x, y, 22 * s, 5)
  if (team === 'b') stroke(`M${x - 20 * s} ${y - 6 * s} Q${x} ${y - 26 * s} ${x + 20 * s} ${y - 6 * s}`, 4)
  line(x + 24 * s, y + 4 * s, x + 130 * s, y + 6 * s, 5); line(x + 24 * s, y + 26 * s, x + 130 * s, y + 24 * s, 5)
  line(x + 130 * s, y + 6 * s, x + 130 * s, y + 24 * s, 4)
  if (up) {
    line(x + 40 * s, y + 6 * s, x + 56 * s, y - 50 * s, 5); line(x + 100 * s, y + 6 * s, x + 130 * s, y - 56 * s, 5)
    line(x + 130 * s, y + 6 * s, x + 170 * s, y - 40 * s, 5); line(x + 130 * s, y + 24 * s, x + 176 * s, y + 6 * s, 5)
  } else {
    line(x + 130 * s, y + 6 * s, x + 200 * s, y + 8 * s, 5); line(x + 130 * s, y + 24 * s, x + 200 * s, y + 26 * s, 5)
    line(x + 40 * s, y + 24 * s, x + 20 * s, y + 52 * s, 5)
  }
}
const row = (xs, foot, s, opts, fn) => xs.map((x, i) => person({ x, foot, s, ...(typeof opts === 'function' ? opts(i) : opts) }))
const marker = (kind, x, foot, s) => {
  if (kind === 'cone') cone(x, foot, 1.1 * s)
  else if (kind === 'flag') flag(x, foot, true, 150 * s)
  else if (kind === 'bucket') prop('bucket', x, foot - 24, s)
  else if (kind === 'bottle') prop('bottle', x, foot - 38, s)
  else if (kind === 'target') { circle(x, foot - 40 * s, 40 * s, 4, '#fff'); circle(x, foot - 40 * s, 22 * s, 4, TINT); circle(x, foot - 40 * s, 6 * s, 3, INK) }
  else if (kind === 'clock') prop('clock', x, foot - 70 * s, s)
  else if (kind === 'person') person({ x, foot, s: s * 0.95, pose: 'hold', flip: true, team: 'b' })
  else if (kind === 'stake') prop('stake', x, foot, s)
  else if (kind === 'line') { for (let y = foot - 120; y < foot; y += 26) line(x, y, x, y + 12, 4) }
  else if (kind === 'basket') { rect(x - 34 * s, foot - 50 * s, 68 * s, 50 * s, '#fff', 4, 6); line(x - 34 * s, foot - 30 * s, x + 34 * s, foot - 30 * s, 3) }
  else if (kind === 'hoop') { ell(x, foot - 4, 60 * s, 14 * s, '#fff', 4) }
}

/* ---------- engines ---------- */
// two lanes of team relay: waiting teammates, runner with a prop, end marker
export function relay({ prop: p = 'ball', end = 'cone', pose = 'run', bub = '!', lanes = 2, wait = 2, poses }) {
  ground(850); if (lanes > 1) ground(580, 30, 1170, 0.2)
  const rows = lanes > 1 ? [[560, 0.74], [820, 0.98]] : [[800, 1.0]]
  rows.forEach(([foot, s], k) => {
    const team = k ? 'b' : 'a'
    for (let w = 0; w < wait; w++) person({ x: 70 + w * 100, foot, s: s * 0.96, pose: 'stand', team })
    const r = person({ x: 450 + (k ? 40 : 0), foot, s, pose: poses ? poses[k % poses.length] : pose, team })
    const [hx, hy] = r.hand('r')
    prop(p, hx + 18, hy - 8, s)
    rays(r.x - 74 * s, r.head + 84 * s, 34, 3, 30, 190)
    marker(end, 1040, foot, s)
    for (let x = 640; x < 960; x += 60) line(x, foot + 2, x + 24, foot + 2, 3)
  })
  bubble(560, 330, bub)
}

// a ring of people (optionally something in the centre, one speaker with a bubble)
export function circleScene({ n = 8, centre, speak, pose = 'stand', poses, stars = false, runner = false, notes = false, hands = false }) {
  ground(860, 60, 1140, 0.25)
  const cx = 600, cy = 520, rx = 390, ry = 170
  const people = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + 0.3
    const depth = (Math.sin(a) + 1) / 2
    people.push({ x: cx + Math.cos(a) * rx, foot: cy + 70 + Math.sin(a) * ry, s: 0.58 + depth * 0.34, i })
  }
  people.sort((p, q) => p.foot - q.foot)
  if (centre) centre(cx, cy + 40)
  people.forEach((p) => {
    const ps = poses ? poses[p.i % poses.length] : pose
    person({ x: p.x, foot: p.foot, s: p.s, pose: ps, flip: p.x > cx, team: p.i % 2 ? 'b' : 'a' })
    if (stars && p.i % 2 === 0) star(p.x, p.foot - FOOT * p.s - 44 * p.s, 12 * p.s + 6)
    if (notes && p.i % 3 === 0) prop('note', p.x + 40 * p.s, p.foot - FOOT * p.s - 20 * p.s, 0.7)
  })
  if (speak) bubbleWide(cx + 250, 200, speak, 86)
  if (runner) { person({ x: 1110, foot: 830, s: 0.95, pose: 'run', flip: true, team: 'b' }); rays(1190, 700, 30, 3, 30, 0) }
  rays(cx, cy - 40, 50, 5, 30, -90)
}

// a table with items on it; people on both sides
export function table({ item = 'paper', people = 3, bub, bubTxt, extra, count = 3, quiet = false }) {
  ground(850)
  const xs = people === 2 ? [380, 820] : people === 3 ? [300, 600, 900] : [220, 450, 750, 980]
  xs.forEach((x, i) => {
    const p = person({ x, foot: 800, s: 0.9, pose: i % 2 ? 'point' : 'hold', flip: x > 600, team: i % 2 ? 'b' : 'a' })
    if (quiet) line(p.x - 8, p.head + 24, p.x + 12, p.head + 24, 5)
  })
  rect(200, 706, 800, 40, '#fff', 5, 4); rect(214, 746, 772, 110, '#fff', 0)
  line(240, 746, 230, 850, 6); line(960, 746, 970, 850, 6)
  for (let i = 0; i < count; i++) prop(item, 340 + i * (520 / Math.max(count - 1, 1)), 672, 0.8)
  if (extra) extra()
  if (bub) bubbleWide(600, 250, bubTxt || '?', 70)
}

// a row of people linked to each other (hands on shoulders/waist/ankles), optionally crouched
export function chain({ n = 5, link = 'waist', crouch = false, pose, flip = false, prop: p, bub = '!', wobble }) {
  ground(850)
  const xs = Array.from({ length: n }, (_, i) => 220 + i * ((n > 5 ? 130 : 150)))
  const s = 0.95
  xs.forEach((x, i) => {
    const arms = link === 'ankles' ? [[-16, 40, -34, 80], [30, 40, 60, 70]] : [[-20, 24, -30, 52], [34, -4, 92, -6]]
    person({ x, foot: 800 - (crouch ? 0 : 0), s, pose: pose || (crouch ? 'crouch' : 'run'), arms, team: i % 2 ? 'b' : 'a', flip })
  })
  if (p) prop(p, 120, 760, 1)
  bubble(980, 300, bub)
  rays(150, 700, 40, 3, 30, 190)
}

// a trail with stops (flags/signs) and walkers
export function trail({ stops = 4, walkers = 2, things = 'flag', bub = '?', hide = false, lookouts = 0, label }) {
  ground(850)
  const pts = [[100, 780], [380, 640], [620, 470], [900, 400], [1100, 560]].slice(0, stops + 1)
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]
    const n = Math.hypot(x2 - x1, y2 - y1) / 34
    for (let k = 0; k < n; k++) circle(x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, 3.5, 3, INK)
  }
  pts.forEach(([x, y], i) => {
    if (things === 'flag') flag(x, y, true, 70)
    else if (things === 'sign') line(x, y, x, y - 60, 5), arrow(x, y - 52, x + 44, y - 66)
    else if (things === 'stone') stone(x - 30, y - 10, 60)
    else if (things === 'env') prop('envelope', x, y - 30, 0.9)
    else if (things === 'tree') tree(x, y, 0.55)
  })
  for (let w = 0; w < walkers; w++) {
    const [x, y] = pts[Math.min(w + 1, pts.length - 1)]
    person({ x: x - 50 + w * 70, foot: y + 90 + w * 10, s: 0.62 + w * 0.06, pose: 'walk', team: w % 2 ? 'b' : 'a', flip: w % 2 === 1 })
  }
  for (let l = 0; l < lookouts; l++) {
    person({ x: 800 + l * 150, foot: 740 + l * 20, s: 0.8, pose: 'point', flip: true, team: 'b' })
    prop('whistle', 720 + l * 150, 590 + l * 20, 0.8)
  }
  if (hide) { tree(300, 560, 0.9); tree(520, 600, 0.8) }
  circle(1040, 190, 56, 5, '#fff'); line(1040, 190, 1040, 150, 5); line(1040, 190, 1066, 204, 5)
  if (label) bubbleWide(300, 250, label, 90); else bubble(250, 260, bub)
}

// the whole group holds one thing (pole, rope, tarp, log)
export function groupHold({ thing = 'stick', n = 5, bub, pose = 'point', up = false, blind = false, shape }) {
  ground(850)
  const xs = Array.from({ length: n }, (_, i) => 140 + (i * 920) / (n - 1))
  if (shape === 'triangle') {
    poly([[600, 360], [1000, 780], [200, 780]], 'none', 5)
  }
  xs.forEach((x, i) => {
    const y = shape ? 780 : 800
    const p = person({ x, foot: y, s: 0.92, pose, arms: [[-22, 16, -26, -20], [22, 16, 26, -20]].map((a) => a), team: i % 2 ? 'b' : 'a' })
    if (blind) line(p.x - 24 * 0.92, p.head - 2, p.x + 24 * 0.92, p.head - 2, 9)
  })
  if (thing === 'rope') stroke(`M130 600 Q600 ${shape ? 330 : 560} 1070 600`, 6)
  else if (thing === 'stick') line(110, 520 + (up ? -20 : 0), 1090, 560 + (up ? -20 : 0), 7)
  else if (thing === 'tarp') poly([[150, 640], [1050, 640], [1090, 700], [110, 700]], TINT, 5)
  else if (thing === 'bigKnot') prop('bigKnot', 600, 560, 2.2)
  if (bub) bubble(600, 300, bub)
}

// blindfolded person(s) guided by others
export function blindGuide({ guides = 2, obstacles = 2, whistle = false, bub = 'à esq.' }) {
  ground(850)
  for (let i = 0; i < obstacles; i++) cone(360 + i * 220, 840 - i * 6, 1.1)
  const b = person({ x: 560, foot: 800, s: 1.0, pose: 'walk', arms: [[-24, 36, -34, 76], [34, 8, 80, 20]] })
  line(b.x - 24, b.head - 2, b.x + 24, b.head - 2, 9)
  for (let g = 0; g < guides; g++) {
    person({ x: 160 + g * 120, foot: 560 + g * 40, s: 0.62, pose: 'point', team: 'b' })
    bubble(300 + g * 90, 250 + g * 40, g ? '!' : bub)
  }
  if (whistle) { person({ x: 1050, foot: 520, s: 0.6, pose: 'wave', flip: true, team: 'b' }); prop('whistle', 960, 400, 0.9); for (const r of [40, 62]) stroke(`M${930 - r} 380 q-${r / 2} 20 0 ${r}`, 3) }
  rays(500, 740, 30, 3, 30, 190)
}

// chase / tag scenes: one chaser, several runners
export function chase({ chaser = 'run', runners = 3, markers = 'cone', bub = '!', pose = 'run', extra }) {
  ground(850); ground(580, 30, 1170, 0.2)
  if (extra) extra()
  const fleeing = Array.from({ length: runners }, (_, i) => ({ x: 650 + (i % 2) * 130 + i * 40, foot: i % 2 ? 580 : 820, s: i % 2 ? 0.74 : 0.96 }))
  fleeing.sort((p, q) => p.foot - q.foot)
  fleeing.forEach((f, i) => { person({ ...f, pose, flip: true, team: 'a' }); rays(f.x + 70 * f.s, f.foot - FOOT * f.s + 90 * f.s, 30, 3, 30, 10) })
  person({ x: 250, foot: 820, s: 1.0, pose: chaser, team: 'b' })
  for (let i = 0; i < 3 && markers; i++) cone(940 + i * 70, 850 - i * 6, 0.9)
  bubble(420, 330, bub)
}

// building: a structure that the team is making
export function build({ structure = 'tripod', n = 3, bub = '!' }) {
  ground(850)
  if (structure === 'tripod') { line(520, 760, 640, 360, 8); line(760, 760, 640, 360, 8); line(640, 760, 640, 340, 8); circle(640, 360, 12, 4, TINT); flag(640, 345, true, 0) ; line(640, 345, 640, 260, 5); flag(640, 340, true, 120) }
  if (structure === 'cans') { for (const x of [540, 640, 740]) prop('can', x, 760, 1.5); line(520, 700, 780, 700, 7); prop('can', 640, 640, 1.5); line(520, 560, 700, 500, 6) }
  if (structure === 'stretcher') {
    line(330, 560, 870, 560, 7); line(330, 600, 870, 600, 7); poly([[340, 560], [860, 560], [860, 600], [340, 600]], TINT, 4)
    lying(420, 520, 0.8, { team: 'b' })
  }
  if (structure === 'chariot') { circle(520, 760, 54, 6, '#fff'); circle(520, 760, 8, 4, INK); circle(780, 760, 54, 6, '#fff'); circle(780, 760, 8, 4, INK); rect(480, 640, 340, 36, '#fff', 5); line(480, 640, 400, 560, 6); line(820, 640, 900, 560, 6); line(500, 760, 520, 676, 4) }
  if (structure === 'planks') { rect(380, 800, 460, 46, TINT, 4); for (const [x, y] of [[470, 720], [560, 700], [660, 720]]) { line(x - 50, y + 60, x + 50, y + 20, 14); } }
  const xs = [140, 260, 380, 900, 1020, 1100].slice(0, Math.max(n, 3) + 1)
  xs.forEach((x, i) => person({ x, foot: 800 + (i % 2) * 20, s: 0.92, pose: i % 2 ? 'hold' : 'point', flip: x > 640, team: i % 2 ? 'b' : 'a' }))
  bubble(640, 200, bub)
}

// quiz scenes: two teams, a host, signs or a board
export function quiz({ signs = ['A', 'B', 'C', 'D'], planes = false, board = false, bub = '?', hostPose = 'wave' }) {
  ground(850)
  if (board) { rect(380, 150, 440, 260, '#fff', 5); for (let i = 0; i < 4; i++) { line(410, 200 + i * 52, 790, 200 + i * 52, 3); text(430, 190 + i * 52, String(i + 1), 28) } }
  else signs.forEach((t, i) => prop('sign', 740 + i * 110, 600, 1.1, t))
  person({ x: 300, foot: 830, s: 0.95, pose: 'hold', team: 'a' }); person({ x: 420, foot: 830, s: 0.95, pose: 'point', team: 'a' })
  person({ x: 1010, foot: 830, s: 0.95, pose: 'hold', flip: true, team: 'b' })
  person({ x: 600, foot: 560, s: 0.65, pose: hostPose, team: 'a' })
  if (planes) { PROPS.plane(520, 440, 1.3); arrow(560, 450, 780, 480); PROPS.plane(190, 700, 1) }
  else { prop('buzzer', 360, 800, 1); prop('buzzer', 960, 800, 1) }
  bubble(640, 300, bub)
}

// two lines facing / converging scenes with arrows
export function converge({ arrows = true, blockers = 2, bub = '!' }) {
  ground(850); ground(570, 30, 1170, 0.2)
  person({ x: 160, foot: 780, s: 0.95, pose: 'run', team: 'a' }); person({ x: 280, foot: 800, s: 0.95, pose: 'run', team: 'a' })
  person({ x: 1040, foot: 780, s: 0.95, pose: 'run', flip: true, team: 'a' }); person({ x: 920, foot: 800, s: 0.95, pose: 'run', flip: true, team: 'a' })
  for (let i = 0; i < blockers; i++) person({ x: 520 + i * 160, foot: 560, s: 0.7, pose: 'ready', team: 'b' })
  if (arrows) { arrow(300, 700, 480, 700); arrow(900, 700, 720, 700) }
  bubble(600, 330, bub)
}

// two things: one hiding (behind trees) and one searching; optional objects
export function hideSeek({ hiders = 2, seekers = 2, objects = 'card', bub = '?', hit = false }) {
  ground(850); ground(590, 30, 1170, 0.2)
  for (let i = 0; i < hiders; i++) person({ x: 200 + i * 230, foot: 590, s: 0.62, pose: i % 2 ? 'crouch' : 'stand', team: 'b' })
  tree(180, 590, 1.0); tree(420, 592, 0.9); tree(660, 592, 1.0); tree(880, 590, 0.9)
  if (objects) prop(objects, 700, 560, 0.7)
  for (let i = 0; i < seekers; i++) {
    const p = person({ x: 760 + i * 170, foot: 820 - i * 10, s: 0.94, pose: 'walk', arms: [[-24, 30, -40, 62], [20, -26, 40, -44]], flip: true, team: 'a' })
    if (hit) prop('ball', p.x - 120, p.head + 60, 1)
  }
  bubble(300, 280, bub)
}

// fixed-row custom scenes used by single activities
export const custom = {
  carroca() {
    ground(850)
    PROPS.sheet(520, 760, 1.2)
    person({ x: 520, foot: 740, s: 0.7, pose: 'hold', team: 'b' })
    for (const [x, f] of [[250, 820], [330, 760]]) person({ x, foot: f, s: 0.95 - (f === 760 ? 0.1 : 0), pose: 'reach', arms: [[-20, 30, -10, 60], [40, 20, 140, 60]], team: 'a' })
    line(260, 760, 450, 790, 4); line(340, 705, 470, 760, 4)
    rays(140, 640, 36, 3, 30, 190); marker('cone', 1000, 850, 1); bubble(760, 380, '!')
  },
  centopeia() { chain({ n: 6, link: 'waist', bub: '1-2' }) },
  lagarta() {
    ground(850)
    ;[220, 400, 580, 760, 940].forEach((x, i) => person({ x, foot: 820, s: 0.9, pose: 'crouch', arms: [[-14, 40, -30, 76], [24, 44, 80, 84]], team: i % 2 ? 'b' : 'a' }))
    marker('flag', 1090, 830, 1.1); bubble(600, 330, '!')
  },
  burro() {
    ground(850)
    const a = person({ x: 480, foot: 800, s: 1.0, pose: 'run', team: 'a' })
    const b = person({ x: 620, foot: 800, s: 1.0, pose: 'run', flip: true, team: 'b' })
    line(430, 640, 700, 640, 7)
    rays(380, 700, 36, 3, 30, 190); rays(740, 700, 36, 3, 30, -10)
    cone(1000, 850, 1.2); cone(120, 850, 1.2); bubble(560, 330, '2 cabeças')
  },
  backToBack() {
    ground(850)
    person({ x: 540, foot: 800, s: 1.05, pose: 'hips', team: 'a' }); person({ x: 640, foot: 800, s: 1.05, pose: 'hips', flip: true, team: 'b' })
    line(560, 500, 620, 500, 6)
    arrow(560, 360, 560, 280); arrow(640, 360, 640, 280)
    person({ x: 200, foot: 820, s: 0.8, pose: 'cheer' }); person({ x: 1010, foot: 820, s: 0.8, pose: 'cheer', flip: true, team: 'b' })
  },
  armWrestle() {
    ground(850)
    rect(330, 560, 540, 36, '#fff', 5); line(370, 596, 360, 780, 6); line(830, 596, 840, 780, 6)
    person({ x: 380, foot: 780, s: 0.95, pose: 'reach', arms: [[-20, 40, -30, 80], [40, 20, 120, 80]] }); person({ x: 820, foot: 780, s: 0.95, pose: 'reach', arms: [[-20, 40, -30, 80], [40, 20, 120, 80]], flip: true, team: 'b' })
    star(600, 480, 16); star(560, 440, 11); star(640, 440, 11)
    text(520, 240, '+1', 50); text(680, 240, '+1', 50)
  },
  fourCorners() {
    ground(850)
    rect(330, 260, 540, 400, 'none', 4)
    ;[[250, 330], [950, 330], [250, 690], [950, 690]].forEach(([x, f], i) => {
      person({ x, foot: f + 90, s: 0.62, pose: i % 2 ? 'ready' : 'stand', flip: x > 600, team: i % 2 ? 'b' : 'a' })
      person({ x: x + (x > 600 ? 90 : -90), foot: f + 90, s: 0.62, pose: 'stand', flip: x > 600, team: i % 2 ? 'b' : 'a' })
    })
    for (const [dx, dy] of [[-30, 0], [30, 0], [0, 20], [-14, -22], [24, -20]]) PROPS.ball(600 + dx, 460 + dy, 0.8)
    arrow(330, 230, 870, 230)
    bubble(600, 150, '!')
  },
  numbersGrid() {
    ground(850)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { rect(330 + c * 120, 300 + r * 110, 100, 90, '#fff', 4); text(380 + c * 120, 360 + r * 110, String(r * 4 + c + 1), 40) }
    person({ x: 780, foot: 560, s: 0.7, pose: 'run', team: 'a' })
    ;[110, 210, 310].forEach((x, i) => person({ x, foot: 800, s: 0.9, pose: 'stand', team: i % 2 ? 'b' : 'a' }))
    prop('clock', 1010, 220, 1.2); text(1010, 330, "90''", 34)
  },
  choque() {
    ground(850)
    const c = person({ x: 600, foot: 700, s: 1.1, pose: 'hold', team: 'a' })
    person({ x: 300, foot: 800, s: 0.9, pose: 'point', team: 'b' }); bubbleWide(280, 380, '7 + 8', 64)
    person({ x: 900, foot: 800, s: 0.9, pose: 'point', flip: true, team: 'b' }); bubbleWide(920, 380, 'cor?', 64)
    person({ x: 600, foot: 440, s: 0.6, pose: 'armsUp', team: 'b' })
    rays(600, 330, 36, 3, 30, -90)
    star(600, 220, 12)
  },
  rps() {
    ground(850)
    person({ x: 470, foot: 800, s: 1.0, pose: 'reach', arms: [[-20, 40, -30, 80], [34, 0, 80, -20]] }); person({ x: 730, foot: 800, s: 1.0, pose: 'reach', arms: [[-20, 40, -30, 80], [34, 0, 80, -20]], flip: true, team: 'b' })
    circle(570, 600, 22, 5, '#fff'); poly([[690, 570], [720, 590], [694, 628]], '#fff', 4); rect(620, 560, 4, 4)
    ;[110, 200, 290].forEach((x, i) => person({ x, foot: 830 - i * 12, s: 0.72, pose: 'cheer', team: 'a' }))
    ;[930, 1020, 1110].forEach((x, i) => person({ x, foot: 830 - i * 12, s: 0.72, pose: 'cheer', flip: true, team: 'b' }))
    bubbleWide(300, 420, 'Ana! Ana!', 80); bubbleWide(940, 420, 'Rui! Rui!', 80)
  },
  stage({ sound = 'muu', jury = true }) {
    ground(850)
    rect(360, 700, 480, 40, '#fff', 5)
    person({ x: 600, foot: 700, s: 0.95, pose: 'armsUp', team: 'a' }); bubbleWide(800, 380, sound, 70)
    if (jury) { rect(220, 770, 200, 60, '#fff', 5); person({ x: 320, foot: 770, s: 0.55, pose: 'hold', team: 'b' }); PROPS.card(500, 800, 0.7); PROPS.card(880, 790, 0.7); text(500, 812, '8', 24) }
    ;[140, 1030].forEach((x, i) => person({ x, foot: 830, s: 0.78, pose: 'cheer', flip: i, team: i ? 'b' : 'a' }))
    for (const [x, y] of [[480, 330], [720, 300], [600, 280]]) prop('note', x, y, 0.8)
  },
  turtles() {
    ground(850); ground(560, 30, 1170, 0.2)
    lying(160, 760, 0.9, { up: true }); lying(500, 780, 0.9, { up: true, team: 'b' }); lying(760, 700, 0.7, { up: true })
    person({ x: 1050, foot: 560, s: 0.7, pose: 'run', flip: true, team: 'b' })
    person({ x: 700, foot: 520, s: 0.6, pose: 'stand', team: 'a' })
    bubbleWide(300, 330, 'um, dois, três...', 100)
  },
  whale() {
    ground(850)
    // whale
    ell(850, 560, 140, 70, TINT, 5); poly([[980, 530], [1080, 470], [1070, 570]], TINT, 5); circle(780, 545, 5, 4, INK); wavy(740, 1000, 620, 8, 40)
    for (let i = 0; i < 3; i++) line(840 + (i - 1) * 16, 480, 840 + (i - 1) * 30, 420, 4)
    // rocks
    for (const [x, y] of [[420, 780], [560, 800]]) poly([[x - 40, y], [x - 20, y - 50], [x + 20, y - 60], [x + 46, y]], '#fff', 5)
    ;[100, 250, 400].forEach((x, i) => person({ x, foot: 800 - i * 20, s: 0.85 - i * 0.04, pose: i === 1 ? 'reach' : 'point', team: i % 2 ? 'b' : 'a' }))
    PROPS.ball(520, 480, 1); arrow(430, 500, 760, 530)
    bubble(300, 300, '!')
  },
  stakes() {
    ground(850)
    ;[330, 450, 570, 690, 810].forEach((x) => prop('stake', x, 640, 1.2))
    ;[360, 500, 640, 780].forEach((x, i) => person({ x, foot: 800, s: 0.85, pose: 'ready', team: 'b' }))
    person({ x: 180, foot: 790, s: 0.9, pose: 'run', team: 'a' }); person({ x: 1000, foot: 790, s: 0.9, pose: 'sneak', flip: true, team: 'a' })
    scarf(560, 470, 1.4); scarf(640, 500, 1.2); scarf(720, 470, 1.4)
    bubble(600, 250, '3')
  },
  maze() {
    ground(850)
    ;[0, 1, 2].forEach((r) => [0, 1, 2, 3].forEach((c) => person({ x: 230 + c * 230, foot: 460 + r * 170, s: 0.46, pose: 'armsUp', arms: [[-40, 8, -78, 10], [40, 8, 78, 10]], team: (r + c) % 2 ? 'b' : 'a' })))
    person({ x: 1000, foot: 840, s: 0.55, pose: 'run', flip: true, team: 'b' }); person({ x: 860, foot: 840, s: 0.5, pose: 'run', flip: true, team: 'a' })
    bubbleWide(300, 240, 'MUDAR!', 90)
  },
  ballWar() {
    ground(850)
    ;[130, 260, 390, 520].forEach((x, i) => { person({ x, foot: 800 - (i % 2) * 40, s: 0.88 - (i % 2) * 0.1, pose: 'reach', team: 'a' }); PROPS.ball(x + 160, 520 + i * 18, 1) })
    ;[1060, 930, 800, 670].forEach((x, i) => { person({ x, foot: 800 - (i % 2) * 40, s: 0.88 - (i % 2) * 0.1, pose: 'reach', flip: true, team: 'b' }); PROPS.ball(x - 160, 560 - i * 16, 1) })
    bubbleWide(600, 220, 'GUERRA!', 100)
  },
  knots() {
    ground(850)
    ;[180, 420, 660, 900].forEach((x, i) => { const p = person({ x, foot: 800, s: 0.85, pose: 'hold', team: i % 2 ? 'b' : 'a' }); prop('rope', p.x + 60, p.head + 130, 0.9) })
    person({ x: 1110, foot: 560, s: 0.6, pose: 'wave', flip: true }); bubbleWide(1010, 380, 'lais de guia!', 100)
  },
  numbersHead() {
    ground(850)
    ;[150, 300, 450].forEach((x, i) => { const p = person({ x, foot: 800 - i * 12, s: 0.82, pose: 'sneak', team: 'a' }); rect(p.x - 26, p.head - 60, 52, 30, '#fff', 4); text(p.x, p.head - 38, String(371 + i * 94), 20) })
    ;[800, 960].forEach((x, i) => person({ x, foot: 800, s: 0.86, pose: 'point', flip: true, team: 'b' }))
    tree(640, 700, 0.9); bubble(850, 330, '371!')
  },
  dizzy() {
    ground(850)
    const p = person({ x: 520, foot: 790, s: 1.05, pose: 'bend', team: 'a' })
    line(430, 560, 520, 800, 8); stroke('M440 540 q40 -30 90 -6', 3)
    for (let i = 0; i < 3; i++) star(520 + (i - 1) * 56, p.head - 50 - (i === 1 ? 20 : 0), 12)
    stroke(`M470 ${p.head - 6} a50 22 0 1 1 100 0`, 3)
    ;[130, 230].forEach((x) => person({ x, foot: 800, s: 0.8, pose: 'stand' })); cone(1000, 850, 1.2)
    person({ x: 820, foot: 820, s: 0.95, pose: 'run', team: 'b' }); rays(750, 700, 34, 3, 30, 190)
  },
  rodeo() {
    ground(850)
    prop('hornsBox', 560, 640, 1.8)
    person({ x: 560, foot: 540, s: 0.5, pose: 'cheer', team: 'a' })
    for (const [dx, dy] of [[-34, 0], [34, 0]]) circle(560 + dx, 560 + dy, 8, 4, INK)
    line(520, 620, 600, 620, 5)
    ;[130, 260, 880, 1030].forEach((x, i) => person({ x, foot: 800, s: 0.82, pose: 'cheer', flip: x > 600, team: i % 2 ? 'b' : 'a' }))
    bubbleWide(560, 220, '1 2 3 ... 8', 90)
    rays(420, 540, 40, 3, 30, 200)
  },
  wolf() {
    ground(850)
    const w = person({ x: 900, foot: 800, s: 1.05, pose: 'hips', team: 'b', flip: true })
    poly([[860, 560], [880, 520], [900, 560]], '#fff', 4)
    ;[110, 230, 350, 470].forEach((x, i) => person({ x, foot: 820 - (i % 2) * 20, s: 0.8, pose: i === 3 ? 'point' : 'stand' }))
    bubbleWide(330, 380, 'Está pronto?', 110)
    bubbleWide(900, 330, 'Sapatos!', 90)
  },
  platform() {
    ground(850)
    poly([[360, 800], [860, 800], [900, 850], [320, 850]], TINT, 5)
    ;[430, 520, 610, 700, 790].forEach((x, i) => person({ x, foot: 800, s: 0.92, pose: i % 2 ? 'cheer' : 'hold', team: i % 2 ? 'b' : 'a' }))
    arrow(150, 780, 320, 800); bubble(1000, 360, '5')
  },
  crocodiles() {
    ground(850)
    raw(`<rect x="300" y="590" width="600" height="170" fill="${TINT}" opacity=".35"/>`)
    for (const x of [360, 680]) { ell(x, 700, 90, 28, '#fff', 4); circle(x + 56, 690, 6, 4, INK); for (let i = 0; i < 4; i++) line(x - 60 + i * 30, 676, x - 52 + i * 30, 660, 3) }
    rect(300, 600, 380, 24, '#fff', 5); rect(560, 650, 340, 24, '#fff', 5)
    person({ x: 470, foot: 600, s: 0.55, pose: 'hold', team: 'a' })
    ;[120, 220].forEach((x, i) => person({ x, foot: 800, s: 0.9, pose: 'point', team: i ? 'b' : 'a' }))
    ;[1000, 1100].forEach((x, i) => person({ x, foot: 800, s: 0.9, pose: 'cheer', flip: true, team: i ? 'b' : 'a' }))
    bubble(600, 400, '5′')
  },
  messenger({ scarfOn = true } = {}) {
    ground(850); ground(580, 30, 1170, 0.2)
    const m = person({ x: 420, foot: 820, s: 0.98, pose: 'run', team: 'a' }); if (scarfOn) scarf(m.x + 28, m.head + 60, 1.1)
    person({ x: 280, foot: 800, s: 0.9, pose: 'ready', team: 'a' }); person({ x: 560, foot: 800, s: 0.9, pose: 'ready', team: 'a' })
    person({ x: 760, foot: 580, s: 0.7, pose: 'sneak', flip: true, team: 'b' }); person({ x: 900, foot: 590, s: 0.7, pose: 'sneak', flip: true, team: 'b' })
    person({ x: 1080, foot: 820, s: 0.95, pose: 'wave', flip: true }); flag(1000, 820, true, 150)
    rays(340, 730, 34, 3, 30, 190); bubble(700, 330, '!')
  },
  bear() {
    ground(850)
    const b = person({ x: 880, foot: 820, s: 1.1, pose: 'hips', team: 'b' }); line(b.x - 26, b.head - 2, b.x + 26, b.head - 2, 9)
    ell(1000, 790, 20, 14, TINT, 4); circle(1000, 770, 5, 3, INK)
    const f = person({ x: 400, foot: 790, s: 1.0, pose: 'sneak', team: 'a' })
    stroke('M300 800 q40 -14 90 0', 3)
    bubbleWide(880, 400, 'Zzz...', 70); text(500, 300, 'shh!', 40)
    for (const dx of [-30, 0, 30]) line(560 + dx, 600, 570 + dx, 624, 3)
  },
  whistleLine() {
    ground(850)
    ;[130, 260, 390, 520].forEach((x, i) => { const p = person({ x, foot: 820 - (i % 2) * 20, s: 0.88, pose: 'walk', arms: [[-24, 30, -40, 62], [34, 8, 80, 20]], team: i % 2 ? 'b' : 'a' }); line(p.x - 22, p.head - 2, p.x + 22, p.head - 2, 9) })
    person({ x: 1050, foot: 700, s: 0.8, pose: 'wave', flip: true }); prop('whistle', 940, 520, 1.1)
    for (const r of [40, 70, 100]) stroke(`M${900 - r} ${500 - r / 3} q-${r / 3} ${r / 3} 0 ${r * 0.66}`, 3)
  },
  clothesline() {
    ground(850)
    line(160, 470, 1040, 470, 5); line(160, 470, 160, 850, 6); line(1040, 470, 1040, 850, 6)
    for (let x = 260; x < 1000; x += 70) PROPS.peg(x, 500, 0.9)
    const p = person({ x: 540, foot: 800, s: 1.0, pose: 'bend', arms: [[16, -10, 20, -40], [30, -12, 34, -44]], team: 'a' })
    person({ x: 340, foot: 800, s: 0.9, pose: 'stand', team: 'b' })
    bag(1010, 780)
    function bag(x, y) { ell(x, y, 50, 22, TINT, 4) }
    bubble(760, 360, '!')
  },
  fishSea() {
    ground(850)
    raw(`<rect x="0" y="330" width="1200" height="520" fill="${TINT}" opacity=".25"/>`)
    for (const y of [380, 560, 740]) wavy(60, 1140, y, 10, 60)
    person({ x: 600, foot: 640, s: 0.85, pose: 'ready', team: 'b' })
    ;[160, 280].forEach((x, i) => { person({ x, foot: 800, s: 0.9, pose: 'run', team: 'a' }); fish(x + 40, 400 + i * 40) })
    ;[1040, 920].forEach((x, i) => person({ x, foot: 800, s: 0.9, pose: 'run', flip: true, team: 'a' }))
    arrow(300, 740, 540, 720); bubble(950, 300, '!')
  },
  tracks() {
    ground(850)
    ;[0, 1, 2].forEach((i) => { rect(180 + i * 280, 280, 220, 180, '#fff', 5); for (let k = 0; k < 3; k++) PROPS.footprint(250 + i * 280 + k * 50, 400 - k * 36, 0.9) })
    ;[240, 520, 800].forEach((x, i) => person({ x, foot: 820, s: 0.88, pose: i === 1 ? 'point' : 'hold', team: i % 2 ? 'b' : 'a' }))
    PROPS.magnifier(1010, 640, 1.8); bubble(1040, 420, '?')
  },
  dance() {
    circleScene({ n: 8, poses: ['armsUp', 'wave', 'cheer', 'hips', 'run'], notes: true })
  },
}
