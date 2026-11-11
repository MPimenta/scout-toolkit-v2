import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DIVISIONS } from '@/lib/design/tokens'

/**
 * Division colours identify divisions only (see docs/design-system.md). Every
 * class is written out in full so Tailwind can see it; this is the only
 * component allowed to use division tokens (checked by tests/unit/design).
 */
const DIVISION_CLASSES: Record<string, string> = {
  cub_scouts:
    'border-division-outline bg-division-cub-scouts text-division-cub-scouts-foreground',
  scouts: 'border-division-outline bg-division-scouts text-division-scouts-foreground',
  adventurers:
    'border-division-outline bg-division-adventurers text-division-adventurers-foreground',
  rovers: 'border-division-outline bg-division-rovers text-division-rovers-foreground',
  leaders:
    'border-division-leaders-border bg-division-leaders text-division-leaders-foreground',
}

const NEUTRAL_CLASSES = 'border-border bg-background text-foreground'

export interface DivisionPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Age-group enum value: cub_scouts, scouts, adventurers, rovers or leaders. */
  ageGroup: string
  /** Short text shown in the pill, for example an objective code. */
  code: string
  /** Optional longer text for the tooltip (for example the objective title). */
  title?: string
  /** The text is the division name itself: it is used as the accessible name without repeating it. */
  labelOnly?: boolean
  /** Overrides the accessible name (for example the full wording with ages behind a compact label). */
  accessibleName?: string
}

export function divisionName(ageGroup: string): string | undefined {
  return DIVISIONS.find((d) => d.ageGroup === ageGroup)?.name
}

export function DivisionPill({ ageGroup, code, title, labelOnly, accessibleName: nameOverride, className, ...props }: DivisionPillProps) {
  const name = divisionName(ageGroup)
  const colour = name ? DIVISION_CLASSES[ageGroup] : NEUTRAL_CLASSES
  const accessibleName = nameOverride ?? (name && !labelOnly ? `${name}: ${code}` : code)

  return (
    <span
      data-slot="division-pill"
      data-age-group={name ? ageGroup : undefined}
      aria-label={accessibleName}
      title={title ? `${accessibleName} — ${title}` : accessibleName}
      className={cn(
        'inline-flex max-w-full items-center rounded-lg border px-2 py-0.5 text-xs font-bold',
        colour,
        className
      )}
      {...props}
    >
      <span className="truncate">{code}</span>
    </span>
  )
}

/** Colour swatch classes for the unselected toggle (division tokens stay inside this file). */
const SWATCH_CLASSES: Record<string, string> = {
  cub_scouts: 'bg-division-cub-scouts',
  scouts: 'bg-division-scouts',
  adventurers: 'bg-division-adventurers',
  rovers: 'bg-division-rovers',
  leaders: 'bg-division-leaders',
}

export interface DivisionToggleProps {
  ageGroup: string
  /** The division wording shown in the toggle. */
  label: string
  selected: boolean
  onToggle: () => void
  className?: string
}

/**
 * A pill that switches a division filter on and off. Selected: the division's fill and label
 * colour, a check icon and a ring. Unselected: an outlined pill with a bordered colour swatch.
 * The state is never conveyed by colour alone.
 */
export function DivisionToggle({ ageGroup, label, selected, onToggle, className }: DivisionToggleProps) {
  const known = Boolean(divisionName(ageGroup))
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-slot="division-toggle"
      data-age-group={ageGroup}
      onClick={onToggle}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-colors',
        selected && known ? DIVISION_CLASSES[ageGroup] : 'border-border bg-background text-foreground hover:bg-muted',
        selected && 'ring-[3px] ring-ring',
        className
      )}
    >
      {selected ? (
        <Check aria-hidden="true" className="h-4 w-4" />
      ) : (
        <span
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 rounded-sm border border-muted-foreground', known ? SWATCH_CLASSES[ageGroup] : 'bg-background')}
        />
      )}
      {label}
    </button>
  )
}
