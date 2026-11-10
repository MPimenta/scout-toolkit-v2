// Builds JPEG contact sheets (12 images each) of a folder of PNGs, to review a batch at a glance.
// Usage: node scripts/illustrations/contact-sheet.mjs <dir-with-forward-slashes>
import fs from 'node:fs'
import { chromium } from 'playwright'

const dir = process.argv[2]
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
const per = 12
const browser = await chromium.launch()
for (let p = 0; p * per < files.length; p++) {
  const chunk = files.slice(p * per, (p + 1) * per)
  const cells = chunk
    .map((f) => `<figure style="margin:0"><img src="file:///${dir}/${f}" style="width:100%;border:1px solid #ccc"><figcaption>${f.replace('.png', '')}</figcaption></figure>`)
    .join('')
  const html = `<body style="margin:0;background:#fff;font:14px Arial"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px">${cells}</div></body>`
  fs.writeFileSync(`${dir}/_sheet.html`, html)
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto(`file:///${dir}/_sheet.html`)
  await page.screenshot({ path: `${dir}/_sheet${p + 1}.jpg`, fullPage: true, type: 'jpeg', quality: 70 })
}
await browser.close()
