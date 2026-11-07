import * as React from 'react';
import { cn } from '@/lib/utils';
import { FACT_ICONS, type FactKind } from '@/lib/design/icons';

/** The icon of a fact kind, 16 px, decorative (the text label always carries the meaning). */
export function FactIcon({ kind, className }: { kind: FactKind; className?: string }) {
  const Icon = FACT_ICONS[kind];
  return <Icon aria-hidden="true" data-fact={kind} className={cn('h-4 w-4 shrink-0 text-muted-foreground', className)} />;
}

/** A fact: its icon followed by the text value. */
export function Fact({ kind, children, className }: { kind: FactKind; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <FactIcon kind={kind} />
      <span>{children}</span>
    </span>
  );
}
