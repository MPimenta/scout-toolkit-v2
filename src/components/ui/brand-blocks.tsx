import * as React from 'react'
import { cn } from '@/lib/utils'

/** Small uppercase label with a teal leaf marker (Brand Book / public site eyebrow). */
export function Eyebrow({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.12em] text-teal-dark',
        className
      )}
      {...props}
    >
      <Leaf aria-hidden className="h-3 w-3 text-accent" />
      {children}
    </p>
  )
}

/** Azul AEP callout with a 6 px teal left border and the callout shadow. */
export function Callout({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'on-blue rounded-lg border-l-[6px] border-accent bg-primary p-5 text-primary-foreground shadow-callout',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Teal band of short values. White on Verde-água AEP is 3.03:1, so the text is
 * always large and bold (>= 18.66 px).
 */
export function ValuesStrip({ values, className }: { values: string[]; className?: string }) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-accent px-4 py-3 text-xl font-bold text-primary-foreground',
        className
      )}
    >
      {values.map((value, index) => (
        <li key={value} className="flex items-center gap-4">
          {index > 0 && <Leaf aria-hidden className="h-3 w-3" />}
          {value}
        </li>
      ))}
    </ul>
  )
}

function Leaf(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 12 12" fill="currentColor" {...props}>
      <path d="M6 0 12 6 6 12 0 6z" />
    </svg>
  )
}
