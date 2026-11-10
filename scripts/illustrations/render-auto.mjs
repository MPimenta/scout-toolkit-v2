// Draws activities with no hand-made scene using auto-scene.mjs.
// Usage: node scripts/illustrations/render-auto.mjs <activities.json> <outDir> [start] [end]
//   activities.json: [{ id, name, desc, format, focus }]. Writes <slug>.svg and <slug>.png, skipping names already drawn.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import * as L from './lib.mjs'
import { sceneFor, fallback } from './auto-scene.mjs'

const [idsFile, outDir, startArg, endArg] = process.argv.slice(2)
const all = JSON.parse(fs.readFileSync(idsFile, 'utf8'))
const list = all.slice(Number(startArg ?? 0), endArg ? Number(endArg) : undefined)
fs.mkdirSync(outDir, { recursive: true })
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } })
let drawn = 0
let fell = 0
for (const a of list) {
  const base = path.join(outDir, slug(a.name))
  if (fs.existsSync(base + '.png')) continue
  const seed = 1000 + (a.id.replace(/\D/g, '') | 0)
  let ok = false
  for (const scene of [sceneFor(a), fallback(a)]) {
    L.newScene(seed)
    try { scene(); ok = true; break } catch (e) { fell++ }
  }
  if (!ok) { console.log('FAILED', a.id, a.name); continue }
  let svg = L.toSvg(`Ilustração da atividade ${esc(a.name)}`)
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  const box = await page.evaluate(() => {
    const g = document.querySelector('g[filter]')
    let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9
    for (const c of g.children) {
      if (c.getAttribute('data-ground')) continue
      const r = c.getBoundingClientRect()
      if (!r.width && !r.height) continue
      x1 = Math.min(x1, r.left); y1 = Math.min(y1, r.top); x2 = Math.max(x2, r.right); y2 = Math.max(y2, r.bottom)
    }
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }
  })
  const scale = Math.min((1200 - 110) / box.w, (900 - 110) / box.h, 1.5)
  const tx = 600 - (box.x + box.w / 2) * scale
  const ty = 450 - (box.y + box.h / 2) * scale
  svg = svg.replace('<g filter="url(#hand)">', `<g filter="url(#hand)" transform="translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${scale.toFixed(3)})">`)
  fs.writeFileSync(base + '.svg', svg)
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  await page.screenshot({ path: base + '.png', clip: { x: 0, y: 0, width: 1200, height: 900 } })
  drawn++
}
await browser.close()
console.log('drawn', drawn, 'of', list.length, 'fallbacks', fell)
