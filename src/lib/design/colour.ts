/**
 * Small colour helpers for the design system: HSL triplets (as used in
 * globals.css) to RGB/hex, and WCAG 2.1 contrast ratios.
 */

export type Rgb = readonly [number, number, number]

/** Parse "217 76% 34%" (CSS custom-property triplet) into h, s, l. */
export function parseHslTriplet(triplet: string): { h: number; s: number; l: number } {
  const match = /^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/.exec(triplet.trim())
  if (!match) {
    throw new Error(`Not an HSL triplet: "${triplet}"`)
  }
  return { h: Number(match[1]), s: Number(match[2]), l: Number(match[3]) }
}

export function hslToRgb(triplet: string): Rgb {
  const { h, s, l } = parseHslTriplet(triplet)
  const sat = s / 100
  const light = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

export function hslToHex(triplet: string): string {
  return rgbToHex(hslToRgb(triplet))
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as unknown as Rgb
}

function channel(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG 2.1 contrast ratio between two colours (1 to 21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
