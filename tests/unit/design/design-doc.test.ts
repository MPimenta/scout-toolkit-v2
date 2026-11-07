import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderDesignDoc } from '@/lib/design/doc'

describe('docs/design-system.md', () => {
  it('is up to date with the tokens (run npm run docs:design)', () => {
    const committed = readFileSync(path.join(process.cwd(), 'docs', 'design-system.md'), 'utf8')
    expect(committed.replace(/\r\n/g, '\n')).toBe(renderDesignDoc())
  })
})
