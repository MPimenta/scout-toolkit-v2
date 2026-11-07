import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { renderDesignDoc } from '../src/lib/design/doc'

const target = path.join(process.cwd(), 'docs', 'design-system.md')
writeFileSync(target, renderDesignDoc(), 'utf8')
console.log(`Wrote ${path.relative(process.cwd(), target)}`)
