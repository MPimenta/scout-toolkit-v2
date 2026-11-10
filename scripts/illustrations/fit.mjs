import { chromium } from 'playwright'
import fs from 'node:fs'
const dir = process.env.OUT
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 900 } })
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
  let svg = fs.readFileSync(dir + '/' + f, 'utf8')
  svg = svg.replace(/ transform="translate[^"]*"(?= *>\n)/, '')
  await p.setContent(`<body style="margin:0">${svg}</body>`)
  const box = await p.evaluate(() => {
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
  fs.writeFileSync(dir + '/' + f, svg)
}
await b.close()
