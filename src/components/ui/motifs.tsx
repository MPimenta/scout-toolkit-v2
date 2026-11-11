import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Decorative motifs from the Brand Book (p. 41): ring, rhombus, rounded star.
 * They are aria-hidden and never carry information. Use them in empty states
 * and the home hero only. Colours come from the theme (currentColor).
 */
type MotifProps = React.SVGProps<SVGSVGElement>

export function Ring({ className, ...props }: MotifProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className={cn('h-16 w-16 text-accent', className)} {...props}>
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="14" />
    </svg>
  )
}

export function Rhombus({ className, outline, ...props }: MotifProps & { outline?: boolean }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className={cn('h-16 w-16 text-primary', className)} {...props}>
      <path
        d="M50 4 96 50 50 96 4 50z"
        fill={outline ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={outline ? 6 : 0}
      />
    </svg>
  )
}

export function Star({ className, ...props }: MotifProps) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 100" className={cn('h-16 w-16 text-accent', className)} {...props}>
      <path
        d="M50 8l11 27 29 3-22 19 7 29-25-15-25 15 7-29L10 38l29-3z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="8"
      />
    </svg>
  )
}
