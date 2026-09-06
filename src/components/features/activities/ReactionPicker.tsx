'use client';

import { REACTION_LABELS } from './discussion';
import type { ReactionCounts, ReactionKey } from '@/lib/ratings';

interface ReactionPickerProps {
  reactions: ReactionCounts;
  myReaction: ReactionKey | null;
  canWrite: boolean;
  onReact: (key: ReactionKey) => void;
}

export function ReactionPicker({
  reactions,
  myReaction,
  canWrite,
  onReact,
}: ReactionPickerProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {REACTION_LABELS.map(({ key, emoji, label }) => {
        const count = reactions[key];
        const active = myReaction === key;
        return (
          <button
            key={key}
            type="button"
            disabled={!canWrite}
            onClick={() => onReact(key)}
            aria-label={label}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
              active
                ? 'border-secondary bg-secondary/10 text-secondary'
                : 'border-border text-muted-foreground'
            } ${canWrite ? 'hover:border-secondary' : 'cursor-default opacity-80'}`}
          >
            <span aria-hidden="true">{emoji}</span>
            <span>{label}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
