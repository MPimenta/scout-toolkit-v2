/**
 * Typed design tokens: the single description of every colour in
 * src/app/globals.css, the declared contrast pairs, and the division palette.
 * A unit test pins globals.css to this file; docs/design-system.md is
 * generated from it (npm run docs:design).
 *
 * Values are CSS HSL triplets (no hsl() wrapper), as Tailwind consumes them.
 */

export type Theme = 'light' | 'dark'

export interface ColourToken {
  /** CSS custom property without the leading dashes, e.g. "primary". */
  name: string
  /** Portuguese name from the Brand Book / public site, or the shadcn role. */
  label: string
  role: string
  light: string
  dark: string
}

export const COLOUR_TOKENS: readonly ColourToken[] = [
  { name: 'background', label: 'Branco', role: 'Page background', light: '0 0% 100%', dark: '200 55% 9%' },
  { name: 'foreground', label: 'Texto', role: 'Headings, navigation, body', light: '200 56.3% 18.8%', dark: '168 21.7% 95.5%' },
  { name: 'card', label: 'Cartão', role: 'Card surface', light: '0 0% 100%', dark: '200 50% 12%' },
  { name: 'card-foreground', label: 'Texto do cartão', role: 'Text on cards', light: '200 56.3% 18.8%', dark: '168 21.7% 95.5%' },
  { name: 'popover', label: 'Menu', role: 'Menus, popovers, dialogs', light: '0 0% 100%', dark: '200 50% 12%' },
  { name: 'popover-foreground', label: 'Texto do menu', role: 'Text on menus', light: '200 56.3% 18.8%', dark: '168 21.7% 95.5%' },
  { name: 'primary', label: 'Azul AEP', role: 'Primary action, links, titles (Pantone 2945 C)', light: '217 76% 34%', dark: '217 80% 74%' },
  { name: 'primary-foreground', label: 'Texto sobre azul', role: 'Text on primary', light: '0 0% 100%', dark: '222.9 84% 4.9%' },
  { name: 'secondary', label: 'Azul muito claro', role: 'Quiet surface, secondary buttons', light: '218.8 58.6% 94.3%', dark: '217 45% 22%' },
  { name: 'secondary-foreground', label: 'Texto sobre azul claro', role: 'Text on secondary', light: '217 76% 34%', dark: '218.8 58.6% 94.3%' },
  { name: 'muted', label: 'Fundo claro', role: 'Section background', light: '168 21.7% 95.5%', dark: '200 40% 16%' },
  { name: 'muted-foreground', label: 'Texto secundário', role: 'Captions, secondary text', light: '203.6 17.1% 37.8%', dark: '200 20% 72%' },
  { name: 'accent', label: 'Verde-água AEP', role: 'Accent, focus, rules, motifs (Pantone 7716 C)', light: '180 100% 32%', dark: '180 100% 32%' },
  { name: 'accent-foreground', label: 'Quase preto', role: 'Text on accent', light: '222.9 84% 4.9%', dark: '222.9 84% 4.9%' },
  { name: 'destructive', label: 'Erro', role: 'Errors and destructive actions', light: '0 72% 45%', dark: '0 62.8% 30.6%' },
  { name: 'destructive-foreground', label: 'Texto sobre erro', role: 'Text on destructive', light: '0 0% 100%', dark: '0 0% 100%' },
  { name: 'border', label: 'Linha', role: 'Hairlines and borders', light: '186 16.7% 88.2%', dark: '200 30% 24%' },
  { name: 'input', label: 'Linha de campo', role: 'Form field borders', light: '186 16.7% 88.2%', dark: '200 30% 24%' },
  { name: 'ring', label: 'Foco', role: 'Keyboard focus outline', light: '180 100% 32%', dark: '180 100% 32%' },
  { name: 'blue-dark', label: 'Azul escuro', role: 'Hover/press, footer', light: '218 77.1% 25.7%', dark: '218 77.1% 25.7%' },
  { name: 'blue-tint', label: 'Azul muito claro (extra)', role: 'Tinted backgrounds', light: '218.8 58.6% 94.3%', dark: '217 45% 22%' },
  { name: 'teal-dark', label: 'Verde-água escuro', role: 'Teal text on light, teal fills with white text', light: '181.4 100% 25.1%', dark: '181.4 100% 25.1%' },
  { name: 'teal-light', label: 'Verde-água claro', role: 'Decorative highlight only (no text)', light: '180 57.9% 47.5%', dark: '180 57.9% 47.5%' },
  { name: 'teal-tint', label: 'Verde-água muito claro', role: 'Tinted background', light: '180 47.1% 93.3%', dark: '180 40% 16%' },
  { name: 'near-black', label: 'Quase preto', role: 'Text on teal and red fills', light: '222.9 84% 4.9%', dark: '222.9 84% 4.9%' },
  // Division colours (Regulamento do Programa para Jovens v1.2, Pantone references)
  { name: 'division-cub-scouts', label: 'Alcateia', role: 'Division fill (Pantone 109)', light: '49.2 100% 50%', dark: '49.2 100% 50%' },
  { name: 'division-cub-scouts-foreground', label: 'Alcateia (texto)', role: 'Label on Alcateia fill', light: '200 56.3% 18.8%', dark: '200 56.3% 18.8%' },
  { name: 'division-scouts', label: 'Tribo de Escoteiros', role: 'Division fill (Pantone 348)', light: '147.7 100% 25.9%', dark: '147.7 100% 25.9%' },
  { name: 'division-scouts-foreground', label: 'Tribo de Escoteiros (texto)', role: 'Label on Escoteiros fill', light: '0 0% 100%', dark: '0 0% 100%' },
  { name: 'division-adventurers', label: 'Tribo de Exploradores', role: 'Division fill (Pantone 280)', light: '221.5 98.1% 20.8%', dark: '221.5 98.1% 20.8%' },
  { name: 'division-adventurers-foreground', label: 'Tribo de Exploradores (texto)', role: 'Label on Exploradores fill', light: '0 0% 100%', dark: '0 0% 100%' },
  { name: 'division-rovers', label: 'Clã', role: 'Division fill (Pantone 032)', light: '355.9 85.5% 56.9%', dark: '355.9 85.5% 56.9%' },
  { name: 'division-rovers-foreground', label: 'Clã (texto)', role: 'Label on Clã fill (white is only 4.02:1)', light: '222.9 84% 4.9%', dark: '222.9 84% 4.9%' },
  { name: 'division-leaders', label: 'Chefia', role: 'Division fill (white)', light: '0 0% 100%', dark: '0 0% 100%' },
  { name: 'division-leaders-foreground', label: 'Chefia (texto)', role: 'Label on Chefia fill', light: '200 56.3% 18.8%', dark: '200 56.3% 18.8%' },
  { name: 'division-leaders-border', label: 'Chefia (linha)', role: 'Border of the Chefia pill', light: '203.6 17.1% 37.8%', dark: '203.6 17.1% 37.8%' },
] as const

/** Non-colour-triplet tokens, pinned by the same test. */
export const OTHER_TOKENS = {
  light: {
    radius: '0.25rem',
    'radius-panel': '1.5rem',
    'shadow-card-hover': '0 12px 28px rgba(21, 57, 75, 0.14)',
    'shadow-menu': '0 10px 24px rgba(21, 57, 75, 0.14)',
    'shadow-callout': '0 12px 30px rgba(21, 70, 151, 0.22)',
    'duration-ui': '180ms',
    gutter: 'clamp(1rem, 4vw, 2rem)',
    'safe-top': 'env(safe-area-inset-top, 0px)',
    'safe-right': 'env(safe-area-inset-right, 0px)',
    'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
    'safe-left': 'env(safe-area-inset-left, 0px)',
    'division-outline': 'transparent',
  },
  dark: {
    'division-outline': 'hsl(0 0% 100% / 0.6)',
  },
} as const

export interface ContrastPair {
  name: string
  /** Token names (see COLOUR_TOKENS). */
  foreground: string
  background: string
  /** Minimum ratio when expectation is "pass"; maximum when it is "fail". */
  threshold: number
  /** "fail" documents a pairing the design system forbids for small text. */
  expectation: 'pass' | 'fail'
  themes: readonly Theme[]
  note?: string
}

const BOTH: readonly Theme[] = ['light', 'dark']
const LIGHT: readonly Theme[] = ['light']

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { name: 'Texto on page', foreground: 'foreground', background: 'background', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Texto on card', foreground: 'card-foreground', background: 'card', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Texto on menu', foreground: 'popover-foreground', background: 'popover', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Texto on Fundo claro', foreground: 'foreground', background: 'muted', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Texto secundário on page', foreground: 'muted-foreground', background: 'background', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Texto secundário on Fundo claro', foreground: 'muted-foreground', background: 'muted', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Primary button label', foreground: 'primary-foreground', background: 'primary', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Azul AEP link on page', foreground: 'primary', background: 'background', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Azul AEP link on Fundo claro', foreground: 'primary', background: 'muted', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Secondary button label', foreground: 'secondary-foreground', background: 'secondary', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Accent button label', foreground: 'accent-foreground', background: 'accent', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Destructive button label', foreground: 'destructive-foreground', background: 'destructive', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'White on Azul escuro', foreground: 'primary-foreground', background: 'blue-dark', threshold: 4.5, expectation: 'pass', themes: LIGHT },
  { name: 'Verde-água escuro text on page', foreground: 'teal-dark', background: 'background', threshold: 4.5, expectation: 'pass', themes: LIGHT },
  { name: 'White on Verde-água escuro', foreground: 'primary-foreground', background: 'teal-dark', threshold: 4.5, expectation: 'pass', themes: LIGHT },
  { name: 'Focus ring on page (non-text)', foreground: 'ring', background: 'background', threshold: 3, expectation: 'pass', themes: BOTH },
  { name: 'Verde-água on page (large text)', foreground: 'accent', background: 'background', threshold: 3, expectation: 'pass', themes: LIGHT },
  { name: 'White on Verde-água (large text)', foreground: 'primary-foreground', background: 'accent', threshold: 3, expectation: 'pass', themes: LIGHT },
  { name: 'Division Alcateia label', foreground: 'division-cub-scouts-foreground', background: 'division-cub-scouts', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Division Tribo de Escoteiros label', foreground: 'division-scouts-foreground', background: 'division-scouts', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Division Tribo de Exploradores label', foreground: 'division-adventurers-foreground', background: 'division-adventurers', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Division Clã label', foreground: 'division-rovers-foreground', background: 'division-rovers', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Division Chefia label', foreground: 'division-leaders-foreground', background: 'division-leaders', threshold: 4.5, expectation: 'pass', themes: BOTH },
  { name: 'Chefia border on white (non-text)', foreground: 'division-leaders-border', background: 'division-leaders', threshold: 3, expectation: 'pass', themes: BOTH },
  // Forbidden for small text; each must stay below the AA minimum.
  { name: 'Never: Azul AEP on Verde-água', foreground: 'primary', background: 'accent', threshold: 4.5, expectation: 'fail', themes: LIGHT, note: 'Brand Book marks the pairing "evitar"' },
  { name: 'Never: white on Verde-água claro', foreground: 'primary-foreground', background: 'teal-light', threshold: 4.5, expectation: 'fail', themes: LIGHT },
  { name: 'Never: white on Clã red', foreground: 'primary-foreground', background: 'division-rovers', threshold: 4.5, expectation: 'fail', themes: LIGHT, note: 'Only 4.02:1; use the near-black label' },
  { name: 'Never: small teal text on page', foreground: 'accent', background: 'background', threshold: 4.5, expectation: 'fail', themes: LIGHT, note: 'Brand Book calls this AAA; it measures 3.03:1' },
] as const

/** Age-group enum value to division token key and display metadata. */
export const DIVISIONS = [
  { ageGroup: 'cub_scouts', key: 'cub-scouts', name: 'Alcateia', ages: '6–10', pantone: '109' },
  { ageGroup: 'scouts', key: 'scouts', name: 'Tribo de Escoteiros', ages: '10–14', pantone: '348' },
  { ageGroup: 'adventurers', key: 'adventurers', name: 'Tribo de Exploradores', ages: '14–17', pantone: '280' },
  { ageGroup: 'rovers', key: 'rovers', name: 'Clã', ages: '17–21', pantone: '032' },
  { ageGroup: 'leaders', key: 'leaders', name: 'Chefia', ages: 'Adultos', pantone: 'Branco' },
] as const

export type DivisionKey = (typeof DIVISIONS)[number]['key']
