import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio, hexToRgb, hslToHex, hslToRgb } from '@/lib/design/colour'
import {
  COLOUR_TOKENS,
  CONTRAST_PAIRS,
  DIVISIONS,
  OTHER_TOKENS,
  type Theme,
} from '@/lib/design/tokens'

const css = readFileSync(path.join(process.cwd(), 'src/app/globals.css'), 'utf8')

function blockFor(selector: ':root' | '.dark'): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`No ${selector} block in globals.css`)
  const end = css.indexOf('\n  }', start)
  const body = css.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, '')
  const out: Record<string, string> = {}
  for (const match of body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    out[match[1]] = match[2].trim()
  }
  return out
}

const BLOCKS: Record<Theme, Record<string, string>> = {
  light: blockFor(':root'),
  dark: blockFor('.dark'),
}

function resolve(theme: Theme, name: string): string {
  const token = COLOUR_TOKENS.find((t) => t.name === name)
  if (!token) throw new Error(`Unknown token ${name}`)
  return token[theme]
}

describe('design tokens are pinned to globals.css', () => {
  for (const theme of ['light', 'dark'] as const) {
    it(`every colour token matches in the ${theme} theme`, () => {
      for (const token of COLOUR_TOKENS) {
        // The dark block only redefines tokens that differ; the rest inherit from :root.
        const value = BLOCKS[theme][token.name] ?? BLOCKS.light[token.name]
        expect(value, `--${token.name} (${theme})`).toBe(token[theme])
      }
    })
  }

  it('non-colour tokens match', () => {
    for (const [name, value] of Object.entries(OTHER_TOKENS.light)) {
      expect(BLOCKS.light[name], `--${name} (light)`).toBe(value)
    }
    for (const [name, value] of Object.entries(OTHER_TOKENS.dark)) {
      expect(BLOCKS.dark[name], `--${name} (dark)`).toBe(value)
    }
  })

  it('declares no colour token that tokens.ts does not know', () => {
    const known = new Set([
      ...COLOUR_TOKENS.map((t) => t.name),
      ...Object.keys(OTHER_TOKENS.light),
      ...Object.keys(OTHER_TOKENS.dark),
    ])
    for (const theme of ['light', 'dark'] as const) {
      for (const name of Object.keys(BLOCKS[theme])) {
        expect(known.has(name), `--${name} in ${theme} is not in tokens.ts`).toBe(true)
      }
    }
  })

  it('uses the Brand Book values for the two brand colours', () => {
    expect(BLOCKS.light.primary).toBe('217 76% 34%')
    expect(BLOCKS.light.accent).toBe('180 100% 32%')
    // HSL triplets are rounded, so the hex round-trip may drift by a step or two.
    const close = (got: string, want: string) =>
      hexToRgb(got).forEach((v, i) => expect(Math.abs(v - hexToRgb(want)[i])).toBeLessThanOrEqual(2))
    close(hslToHex('217 76% 34%'), '#154697')
    close(hslToHex('180 100% 32%'), '#00A5A5')
  })

  it('keeps the division palette within rounding of the Regulamento conversions', () => {
    const expected: Record<string, string> = {
      'division-cub-scouts': '#FFD100',
      'division-scouts': '#00843D',
      'division-adventurers': '#012169',
      'division-rovers': '#EF3340',
      'division-leaders': '#FFFFFF',
    }
    for (const [name, hex] of Object.entries(expected)) {
      const got = hslToRgb(resolve('light', name))
      const want = hexToRgb(hex)
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(got[i] - want[i]), `${name} channel ${i}`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('defines a division token for every age group', () => {
    for (const division of DIVISIONS) {
      expect(BLOCKS.light[`division-${division.key}`]).toBeDefined()
      expect(BLOCKS.light[`division-${division.key}-foreground`]).toBeDefined()
    }
  })

  it('uses a 4 px control radius and no cream token', () => {
    expect(BLOCKS.light.radius).toBe('0.25rem')
    expect(Object.keys(BLOCKS.light).some((n) => n.includes('cream'))).toBe(false)
  })
})

describe('declared contrast pairs', () => {
  for (const pair of CONTRAST_PAIRS) {
    for (const theme of pair.themes) {
      it(`${pair.name} (${theme})`, () => {
        const ratio = contrastRatio(
          hslToRgb(resolve(theme, pair.foreground)),
          hslToRgb(resolve(theme, pair.background))
        )
        if (pair.expectation === 'pass') {
          expect(ratio).toBeGreaterThanOrEqual(pair.threshold)
        } else {
          expect(ratio).toBeLessThan(pair.threshold)
        }
      })
    }
  }

  it('reproduces the documented division ratios', () => {
    const ratioFor = (key: string) =>
      contrastRatio(
        hslToRgb(resolve('light', `division-${key}-foreground`)),
        hslToRgb(resolve('light', `division-${key}`))
      )
    expect(ratioFor('cub-scouts')).toBeCloseTo(8.36, 1)
    expect(ratioFor('scouts')).toBeCloseTo(4.81, 1)
    expect(ratioFor('adventurers')).toBeCloseTo(14.76, 1)
    expect(ratioFor('rovers')).toBeGreaterThanOrEqual(4.9)
    expect(ratioFor('leaders')).toBeCloseTo(12.22, 1)
  })

  it('shows white on teal is large-text only (3.03:1), not AAA as the Brand Book says', () => {
    const ratio = contrastRatio(hexToRgb('#FFFFFF'), hexToRgb('#00A5A5'))
    expect(ratio).toBeCloseTo(3.03, 1)
    expect(ratio).toBeLessThan(4.5)
  })
})
