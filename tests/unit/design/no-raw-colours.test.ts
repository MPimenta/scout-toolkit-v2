import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

/** Files allowed to carry literal colours: third-party artwork and PDF styles. */
const ALLOW_LIST = [
  /src[\\/]components[\\/]ui[\\/]IconDisplay\.tsx$/,
  /src[\\/]components[\\/]features[\\/]sdg[\\/]/,
  /src[\\/]lib[\\/]reports[\\/]/,
  /src[\\/]app[\\/]api[\\/]/,
]

/** The only component allowed to read division tokens. */
const DIVISION_PILL = /src[\\/]components[\\/]ui[\\/]DivisionPill\.tsx$/

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black'

const RULES: { name: string; pattern: RegExp }[] = [
  { name: 'hex colour', pattern: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])/ },
  { name: 'rgb()/rgba()', pattern: /\brgba?\(/ },
  {
    name: 'Tailwind palette colour',
    pattern: new RegExp(
      `\\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|decoration|shadow|accent|caret)-(?:${PALETTE})(?:-\\d{2,3})?(?:/\\d+)?(?![\\w-])`
    ),
  },
  { name: 'unsupported font weight (Arial has 400 and 700)', pattern: /\bfont-(?:medium|semibold|extrabold|black|light|thin)\b/ },
]

const DIVISION_USE = /\b(?:bg|text|border|ring)-division-|--division-|var\(--division/

function listSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      listSources(full, out)
    } else if (/\.(tsx|ts)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const files = [
  ...listSources(path.join(ROOT, 'src', 'components')),
  ...listSources(path.join(ROOT, 'src', 'app')),
].filter((f) => !ALLOW_LIST.some((re) => re.test(f)))

function scan(pattern: RegExp): string[] {
  const hits: string[] = []
  for (const file of files) {
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .forEach((line, index) => {
        if (pattern.test(line)) {
          hits.push(`${path.relative(ROOT, file)}:${index + 1}: ${line.trim()}`)
        }
      })
  }
  return hits
}

describe('components use design tokens only', () => {
  for (const rule of RULES) {
    it(`has no ${rule.name}`, () => {
      expect(scan(rule.pattern), `Found ${rule.name} outside the allow-list`).toEqual([])
    })
  }

  it('reads division tokens only in DivisionPill', () => {
    const offenders = scan(DIVISION_USE).filter((hit) => !DIVISION_PILL.test(hit.split(':')[0]))
    expect(offenders, 'Division colours identify divisions only').toEqual([])
  })
})
