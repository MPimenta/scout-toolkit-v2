## Context

Story 2.2 already centralized HSL tokens in `src/app/globals.css`. The new manual and assets have not arrived (`docs/brand-handoff.md`). This change specifies the visual system and applies only the process, docs, and PDF/devlog decisions. A later change (`swap-brand-tokens`) applies real values.

## Goals / Non-Goals

**Goals:**

- Single token source and a written handoff gate
- PDF stays print-neutral; devlog stays in sync on the next token swap
- OpenSpec + planning.md coexistence pointer

**Non-Goals:**

- Inventing a new palette
- Replacing Inter/Atkinson before a licensed font is handed over
- Recolouring SDG icons
- Rewriting Portuguese copy or Cursor rules about Google OAuth

## Decisions

- Keep current `--primary: 84 47% 50%` and `--secondary: 220 58% 23%` until handoff is complete
- PDF: print-neutral greys (readability on paper). Brand header on PDFs is a later change
- Devlog: same palette as the app when tokens move; do not edit hex now
- Header continues to expect `/logo_escoteiros.png` until a new mark is supplied
- Product name stays Kit de Atividades

## Risks / Trade-offs

- The live UI will still look like the old brand until assets arrive
- Node 20.10 warns on OpenSpec 1.12 (wants >= 20.19); CLI still runs

## Migration Plan

1. Land docs and OpenSpec specs now
2. When the manual arrives, open `swap-brand-tokens` and replace HSL + assets
3. Then walk home, activities, programs, builder, sign-in, and one export
