// Stick-figure illustration kit: figures, poses and props in one hand-drawn style (4:3, 1200x900).
export const INK = '#0b3a4a'
export const TINT = '#bfe3f2'
export const W = 1200
export const H = 900
export const FOOT = 214

let out = []
let seed = 11
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const j = (n = 2.2) => (rnd() - 0.5) * 2 * n

export function newScene(s = 11) {
  out = []
  seed = s
}

export const stroke = (d, w = 5, extra = '') =>
  out.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`)
export const line = (x1, y1, x2, y2, w = 5) =>
  stroke(`M${x1 + j()} ${y1 + j()} L${(x1 + x2) / 2 + j(3)} ${(y1 + y2) / 2 + j(3)} L${x2 + j()} ${y2 + j()}`, w)
export const circle = (cx, cy, r, w = 5, fill = 'none') =>
  out.push(`<ellipse cx="${cx + j(1)}" cy="${cy + j(1)}" rx="${r + j(1.5)}" ry="${r + j(1.5)}" fill="${fill}" stroke="${INK}" stroke-width="${w}"/>`)
export const raw = (svg) => out.push(svg)
export const text = (x, y, t, size = 30) =>
  out.push(`<text x="${x}" y="${y}" font-family="Arial" font-size="${size}" font-weight="700" text-anchor="middle" fill="${INK}">${t}</text>`)

/** Poses face right. Arms are [elbowDx, elbowDy, handDx, handDy]; legs [kneeDx, kneeDy, footDx, footDy]. */
export const POSES = {
  stand: { l: [-24, 36, -34, 76], r: [24, 36, 34, 76], ll: [-4, 44, -8, 92], rl: [4, 44, 8, 92] },
  run: { l: [-30, 18, -58, 52], r: [32, -8, 64, -38], ll: [-34, 28, -74, 52], rl: [30, 36, 58, 92], lean: 8 },
  reach: { l: [-26, 40, -56, 12], r: [48, -6, 110, 6], ll: [-12, 40, -40, 80], rl: [24, 36, 52, 84], lean: -6 },
  armsUp: { l: [-26, -30, -44, -84], r: [26, -30, 44, -84], ll: [-18, 40, -34, 92], rl: [18, 40, 34, 92] },
  ready: { l: [-34, 14, -66, -12], r: [34, 14, 66, -12], ll: [-30, 40, -34, 88], rl: [30, 40, 34, 88] },
  point: { l: [-24, 36, -34, 76], r: [36, -18, 78, -10], ll: [-4, 44, -8, 96], rl: [8, 44, 10, 96] },
  wave: { l: [-24, 36, -34, 76], r: [22, -24, 34, -76], ll: [-4, 44, -8, 92], rl: [4, 44, 8, 92] },
  hold: { l: [-20, 30, 20, 40], r: [20, 30, 60, 40], ll: [-4, 44, -8, 92], rl: [4, 44, 8, 92] },
  bend: { l: [20, 30, 58, 74], r: [40, 30, 78, 70], ll: [-10, 44, -24, 92], rl: [14, 44, 28, 92], lean: 22 },
  carry: { l: [-26, 30, -16, 68], r: [26, 30, 16, 68], ll: [-14, 44, -30, 88], rl: [16, 44, 36, 90], lean: 16 },
  cheer: { l: [-26, -30, -44, -84], r: [26, 6, 60, -10], ll: [-6, 44, -12, 92], rl: [8, 44, 16, 92] },
  hips: { l: [-34, 30, -14, 66], r: [34, 30, 14, 66], ll: [-8, 44, -18, 92], rl: [8, 44, 18, 92] },
  crouch: { l: [-14, 40, 16, 76], r: [24, 44, 52, 82], ll: [-30, 20, -50, 60], rl: [28, 28, 46, 78], lean: 18 },
  walk: { l: [-24, 30, -40, 62], r: [26, 28, 44, 58], ll: [-12, 44, -34, 90], rl: [14, 44, 30, 92] },
  sneak: { l: [-40, 8, -100, 22], r: [30, 20, 34, 56], ll: [-20, 40, -42, 86], rl: [18, 40, 40, 90], lean: -12 },
}

/** A person: foot is the sole line, s the scale, team 'b' wears a cap line, flip mirrors to face left. */
export function person({ x, foot, s = 0.9, pose = 'stand', team = 'a', flip = false, arms, legs }) {
  const p = { ...POSES[pose], ...(arms ? { l: arms[0], r: arms[1] } : {}), ...(legs ? { ll: legs[0], rl: legs[1] } : {}) }
  const hy = foot - FOOT * s
  const start = out.length
  const lean = p.lean ?? 0
  const P = (dx, dy) => [x + (dx + lean * (dy / 130)) * s, hy + dy * s]
  const w = (n) => n * Math.max(0.8, s)
  const seg = (pts, sw = 5) => {
    const q = pts.map(([dx, dy]) => P(dx, dy))
    stroke(`M${q[0][0] + j()} ${q[0][1] + j()} ` + q.slice(1).map(([px, py]) => `L${px + j()} ${py + j()}`).join(' '), w(sw))
  }
  circle(x, hy, 24 * s, w(5))
  if (team === 'b') {
    const a = P(-22, -6)
    const b = P(22, -6)
    stroke(`M${a[0]} ${a[1]} Q${x} ${hy - 26 * s} ${b[0]} ${b[1]}`, w(4))
  }
  seg([[-17, 34], [-19, 90], [-17, 128]])
  seg([[17, 34], [19, 90], [17, 128]])
  seg([[-17, 34], [17, 34]])
  seg([[-18, 100], [18, 100]])
  seg([[-17, 38], [-17 + p.l[0], 38 + p.l[1]], [-17 + p.l[2], 38 + p.l[3]]])
  seg([[17, 38], [17 + p.r[0], 38 + p.r[1]], [17 + p.r[2], 38 + p.r[3]]])
  seg([[-11, 128], [-11 + p.ll[0], 128 + p.ll[1]], [-11 + p.ll[2], 128 + p.ll[3]]])
  seg([[11, 128], [11 + p.rl[0], 128 + p.rl[1]], [11 + p.rl[2], 128 + p.rl[3]]])
  if (flip) {
    const body = out.splice(start).join('\n')
    out.push(`<g transform="translate(${2 * x},0) scale(-1,1)">${body}</g>`)
  }
  return { x, head: hy, foot, s, hand: (side) => {
    const a = side === 'r' ? p.r : p.l
    const sx = side === 'r' ? 17 : -17
    const [px, py] = P(sx + a[2], 38 + a[3])
    return [flip ? 2 * x - px : px, py]
  } }
}

export const rays = (cx, cy, r = 38, n = 3, spread = 40, dir = -90) => {
  for (let i = 0; i < n; i++) {
    const a = ((dir + (i - (n - 1) / 2) * spread) * Math.PI) / 180
    line(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + 22), cy + Math.sin(a) * (r + 22), 4)
  }
}

export const bubble = (x, y, ch) => {
  raw(`<ellipse cx="${x}" cy="${y}" rx="30" ry="26" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M${x - 14} ${y + 20} L${x - 24} ${y + 44} L${x + 6} ${y + 24}" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)
  text(x, y + 10, ch, 30)
}
export const bubbleWide = (x, y, t, w = 70) => {
  raw(`<ellipse cx="${x}" cy="${y}" rx="${w}" ry="34" fill="#fff" stroke="${INK}" stroke-width="4"/><path d="M${x - 20} ${y + 28} L${x - 34} ${y + 58} L${x + 6} ${y + 32}" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)
  text(x, y + 10, t, Math.min(34, Math.max(24, (w * 1.75) / Math.max(String(t).length, 1))))
}
export const ground = (y, x1 = 30, x2 = 1170, o = 0.35) => stroke(`M${x1} ${y} Q${(x1 + x2) / 2} ${y + 6} ${x2} ${y}`, 3, `opacity="${o}" data-ground="1"`)
export const cone = (x, y, k = 1) => {
  raw(`<path d="M${x - 16 * k} ${y} L${x} ${y - 38 * k} L${x + 16 * k} ${y} Z" fill="${TINT}" stroke="${INK}" stroke-width="${4 * k}" stroke-linejoin="round"/>`)
  line(x - 22 * k, y, x + 22 * k, y, 4 * k)
}
export const flag = (x, base, filled = true, h = 200) => {
  line(x, base, x, base - h, 6)
  const tri = `M${x + 3} ${base - h + 2} L${x + 100} ${base - h + 32} L${x + 3} ${base - h + 66}`
  if (filled) raw(`<path d="${tri} Z" fill="${TINT}" stroke="none"/>`)
  stroke(tri + ' Z', 5)
}
export const scarf = (x, y, k = 1) => raw(`<path d="M${x} ${y} q${28 * k} ${-28 * k} ${56 * k} ${-6 * k} q${-26 * k} ${26 * k} ${-56 * k} ${6 * k} Z" fill="${TINT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)
export const tree = (x, foot, k = 1) => {
  line(x - 10 * k, foot, x - 8 * k, foot - 110 * k, 6)
  line(x + 10 * k, foot, x + 8 * k, foot - 110 * k, 6)
  for (const [dx, dy, r] of [[-34, -150, 44], [30, -158, 48], [0, -200, 52], [-6, -126, 40]]) {
    circle(x + dx * k, foot + dy * k, r * k, 5, '#fff')
  }
}
export const star = (x, y, r = 18) => {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const a = (-90 + i * 36) * (Math.PI / 180)
    const rr = i % 2 ? r * 0.45 : r
    pts.push(`${x + Math.cos(a) * rr} ${y + Math.sin(a) * rr}`)
  }
  raw(`<path d="M${pts.join(' L')} Z" fill="${TINT}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`)
}
export const arrow = (x1, y1, x2, y2) => {
  line(x1, y1, x2, y2, 4)
  const a = Math.atan2(y2 - y1, x2 - x1)
  line(x2, y2, x2 - 18 * Math.cos(a - 0.5), y2 - 18 * Math.sin(a - 0.5), 4)
  line(x2, y2, x2 - 18 * Math.cos(a + 0.5), y2 - 18 * Math.sin(a + 0.5), 4)
}
export const wavy = (x1, x2, y, amp = 8, step = 40) => {
  let d = `M${x1} ${y}`
  for (let x = x1; x < x2; x += step) d += ` q${step / 4} ${-amp} ${step / 2} 0 t${step / 2} 0`
  stroke(d, 3.5)
}
export const stone = (x, y, w = 70) => raw(`<path d="M${x} ${y} l${w} -6 l12 28 l-${w + 8} 6 Z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)
export const fish = (x, y, flip = false) => {
  const d = flip ? -1 : 1
  raw(`<path d="M${x} ${y} q${30 * d} ${-22} ${64 * d} 0 q${-34 * d} ${22} ${-64 * d} 0 Z M${x + 62 * d} ${y} l${22 * d} ${-14} l0 28 Z" fill="${TINT}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`)
  circle(x + 14 * d, y - 3, 2.5, 3, INK)
}
export const spider = (x, y, k = 1) => {
  raw(`<ellipse cx="${x}" cy="${y}" rx="${16 * k}" ry="${12 * k}" fill="${INK}"/>`)
  for (const s of [-1, 1]) for (const [dx, dy] of [[26, -22], [34, -6], [34, 10], [26, 26]]) {
    stroke(`M${x + s * 10 * k} ${y} Q${x + s * dx * k} ${y + dy * k - 10 * k} ${x + s * (dx + 14) * k} ${y + dy * k + 8 * k}`, 3)
  }
}
export const bug = (x, y, k = 1) => {
  raw(`<ellipse cx="${x}" cy="${y}" rx="${9 * k}" ry="${13 * k}" fill="${INK}"/>`)
  raw(`<ellipse cx="${x - 16 * k}" cy="${y - 10 * k}" rx="${14 * k}" ry="${8 * k}" fill="${TINT}" stroke="${INK}" stroke-width="3"/>`)
  raw(`<ellipse cx="${x + 16 * k}" cy="${y - 10 * k}" rx="${14 * k}" ry="${8 * k}" fill="${TINT}" stroke="${INK}" stroke-width="3"/>`)
}
export const flame = (x, y, k = 1) =>
  raw(`<path d="M${x} ${y} q${-22 * k} ${-6 * k} ${-14 * k} ${-34 * k} q${8 * k} ${14 * k} ${14 * k} ${-4 * k} q${4 * k} ${-26 * k} ${24 * k} ${-36 * k} q${-6 * k} ${30 * k} ${10 * k} ${46 * k} q${-6 * k} ${24 * k} ${-34 * k} ${28 * k} Z" fill="${TINT}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`)
export const compass = (x, y, r = 22) => {
  circle(x, y, r, 4, '#fff')
  line(x, y + r * 0.7, x, y - r * 0.7, 3)
  raw(`<path d="M${x} ${y - r * 0.7} l5 12 l-10 0 Z" fill="${INK}"/>`)
}
export const sticks = (x, y) => {
  for (const [dx, dy] of [[-30, 0], [30, -2], [-6, -14], [14, -16], [-18, -26]]) line(x, y, x + dx * 1.2, y + dy - 10, 5)
}

export function toSvg(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
<defs><filter id="hand" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter></defs>
<rect width="${W}" height="${H}" fill="#ffffff"/>
<g filter="url(#hand)">
${out.join('\n')}
</g>
</svg>
`
}
