## Context

**Current panel** (`ActivityFilters`, about 620 lines): a collapsed bar with search, an "Expandir" control and active-filter badges; expanded, a four-column grid of checkbox lists (group size, effort, location, age group), a duration block (operator select, min, max), checkbox lists for activity types and SDGs, and a flat list of every educational objective. On phones it opens in a sheet. Filter state is `FilterState` (search, groupSize[], effortLevel[], location[], ageGroup[], activityType[], sdgs[], educationalGoals[], durationMin, durationMax, durationOperator).

**Data facts** (97 approved activities; Matriz dataset):

- Duration: min 5, max 240, median 20. Share ≤10 min 18%, ≤15 min 48%, ≤20 min 65%, ≤30 min 79%, ≤60 min 95%. Distinct values: 5, 10, 15, 20, 25, 30, 40, 45, 60, 90, 120, 240.
- Facts: group sizes small 19, medium 87, large 71; effort low 36, medium 42, high 19; location inside 60, outside 90 (activities can have several).
- Divisions: Alcateia 52, Escoteiros 82, Exploradores 69, Clã 55, Chefia 37.
- Objectives: 174 specific, 40 general, 6 areas; 46–47 specific per division; per division and area 5–11; per general objective up to 14 across divisions.

## Goals / Non-Goals

**Goals:**

- A filter panel that looks and behaves like the rest of the product (pills, shared icons, design tokens).
- Duration expressed as the range people think in.
- An objective filter that can be scanned and used on a phone.
- The same facts iconography on every screen.

**Non-Goals:**

- No new filters (for example risk level or source); no change to the search box.
- No change to sorting, pagination or the table/tiles toggle.
- No SDG filter redesign (it stays a list for now).
- No saved filters or URL sharing.

## Decisions

**D1. Division pills.**
`DivisionToggle` wraps `DivisionPill` (the only place division tokens are allowed) and adds `aria-pressed`, a 44 px hit area and two states. **Unselected**: white pill, Linha border, Texto label, and a small square swatch of the division colour with a Texto-secundário border (the swatch is non-text, and yellow on white is only 1.4:1 without that border). **Selected**: the division's own fill and label colour plus a check icon and a 3 px focus-style ring in Verde-água, so the state is never conveyed by colour alone. Chefia keeps its border. The label is the existing UI wording ("Lobitos (6-10)", …); copy changes are out of scope.
*Alternative:* always-filled pills with opacity for "off". Rejected: reduced opacity breaks the AA label contrast.

**D2. One facts component.**
`src/lib/design/icons.ts` exports `FACT_ICONS` (`duration` Clock, `groupSize` Users, `effort` Target, `location` MapPin) and `FactIcon`, `Fact` components. Every screen that shows a fact imports them; a unit test scans `src/components` and fails if `TrendingUp` or a second icon is used for these facts. Icons are decorative (`aria-hidden`) because the label text is always present.

**D3. Duration review and decision.**

| Option | Verdict |
| --- | --- |
| Operator select + min + max (today) | Rejected: the operator only matters when exactly one bound is set, and it is invisible in the chip. |
| Two number fields (min, max) | Necessary as the keyboard and precision path, but poor for browsing because the useful range is small and skewed. |
| Two-handle slider with fixed stops | Good for browsing; needs a non-linear scale because 79% of activities are ≤30 min and the tail reaches 240. |
| Quick presets (≤15, 15–30, 30–60, 60+) | Useful shortcuts; not needed at first. |

**Decision:** a stepped two-handle slider over the stops 5, 10, 15, 20, 30, 45, 60, 90, 120+ (the last stop means "no upper limit") **plus** two minute fields kept in sync, and a readout ("15–45 min", "≤30 min", "≥60 min", "Qualquer duração"). The slider handles are keyboard-operable (arrow keys move one stop); the fields accept any integer and the slider shows the nearest stop. Bounds are inclusive. Default is the full range, which means no filter and no chip. A minimum greater than the maximum is rejected inline and not applied. API: `duration_min` and `duration_max` only; `duration_operator` is ignored.
*Alternative:* log-scale continuous slider. Rejected: harder to hit round values and to explain.

**D4. Objective filter tree.**
Three levels from the Matriz: area (6) → general objective (40) → specific objective (174). A node is one of **off**, **on** (the whole node is selected) or **partial** (some descendants selected). Rules:

- Selecting a node selects "any objective under it" and clears any selection below it (it already covers them); deselecting a node clears it.
- A parent shows *partial* when a descendant is selected but the parent itself is not.
- Counts show the objectives available for the chosen divisions ("Físico · 8") and, when any, how many selections sit under the group ("2 selecionados").
- With divisions selected, only objectives of those divisions are listed, and selected **specific** objectives that no longer apply are dropped (existing rule); area and general selections stay, because they remain valid.
- Search matches code, title and the general objective's title, expands the groups that match and highlights the match.
- Groups with a selection are open by default; all others are closed. On phones only one area is open at a time.
- A leaf shows its code in the division-coloured pill (the objective's own divisions; a shared "3-4" objective shows two pills) followed by its title, clamped to two lines with the full text on focus/hover.
- Request: the selection is sent as three comma-separated parameters, `educational_areas`, `general_objectives`, `educational_goals`; the catalogue returns activities linked to **any** of them (OR), combined with the other filters by AND, as today.

*Alternatives:* keep the flat list (rejected: too long); an area-only filter of six checkboxes (quick but too coarse to find "4F.3"); the 20 *Caminhos Educativos* as the first level (smaller groups, but less familiar and one more click).

**D5. Types.**
Grouped by `kind` (Formato / Foco, then Outros) with `activity_count` next to each name; types with a count of 0 are hidden; descriptions appear as the option's title. Without the new fields the list stays flat.

**D6. Panel layout.**

```
FILTROS                                             [Limpar] [Recolher]
Pesquisar …
Faixa etária
  [■ Lobitos (6-10)] [■ Escoteiros (10-14)✓] [■ Exploradores] [■ Clã] [□ Chefia]
┌ 👥 Grupo ──────┬ 🎯 Esforço ─────┬ 📍 Local ──────┬ 🕒 Duração ────────────────┐
│ ☐ Pequeno      │ ☐ Baixo         │ ☐ Interior     │ 15 ━━●━━━━━━━●━━ 45 min    │
│ ☑ Médio        │ ☐ Médio         │ ☐ Exterior     │ [ 15 ] min – [ 45 ] min    │
│ ☐ Grande       │ ☐ Alto          │                │                             │
└────────────────┴─────────────────┴────────────────┴─────────────────────────────┘
Tipo
  Formato   ☐ Jogo (72)  ☐ Desafio (25)  ☐ Aventura (7)  ☐ Quebra-Gelo (14)
  Foco      ☐ Cooperação (34) ☐ Técnica (21) ☐ Reflexão (7) …
Objetivos educativos                      🔎 Pesquisar objetivo…
  Selecionados:  [4E.1.1] [Físico ✕]
  ▸ Físico · 8              ▾ Social · 11 · 2 selecionados
      ▾ 4S Liderar e participar…        ☑ (parcial)
          ☑ [4S.1.2] Expressar apreço pelo trabalho dos outros
          ☐ [4S.2.2-3] Liderar equipas em projetos
  ▸ Afetivo · 5   ▸ Carácter · 9   ▸ Espiritual · 8   ▸ Intelectual · 6
ODS …
```

On phones the same content is one column in the sheet: sticky search at the top, sticky "Limpar" and "Ver N atividades" at the bottom, one open area at a time.

**D7. Active-filter chips** mirror the panel: division chips are pills, facts chips carry the fact icon, the duration chip reads "15–45 min", objective chips show the code pill or the area/general objective name. Each chip is removable.

**D8. Divisions as pills on the cards.**
The card shows one `DivisionPill` per division of the activity, in the fixed order Alcateia, Escoteiros, Exploradores, Clã, Chefia, on one wrapping row under the facts. The pill text is a **compact label** (a new locale key `ageGroupShort`: Lobitos, Escoteiros, Exploradores, Caminheiros, Dirigentes); the ages stay in the accessible name and the title ("Lobitos (6-10)"). All divisions are shown (at most five); there is no "+k". The text line "Lobitos (6-10), Escoteiros (10-14) +3" and its Users icon are removed from the card; the detail page keeps the full wording. The objective pills on the card keep their codes and division colours, so the two kinds of pill are told apart by their text (name versus code).
*Alternative:* a thin colour strip on the card edge. Rejected: the strip would carry meaning by colour alone, and the pills already exist.

## Risks / Trade-offs

- **Stepped slider hides 25 and 40 min**: the two fields cover them; the nearest stop is shown.
- **Tri-state tree is more logic than a checkbox list**: the node rules are pure functions with unit tests, independent of the rendering.
- **New API parameters add server work**: a join through `general_objectives`; bounded by the size of the Matriz and indexed on the existing foreign keys.
- **Hiding zero-count types** depends on the types change; the flat fallback keeps the panel usable.
- **Color-only risk on pills**: the selected state also has a check icon and a ring; labels are text.

## Migration Plan

1. API first (new parameters, operator ignored), with tests; no schema change.
2. Shared `FactIcon` and the migration of detail, card and table.
3. Filter sections one at a time (pills, facts, duration, types, objectives), each behind the same panel, then the active chips and the phone sheet.
4. No data migration; rollback is a revert of the components and the API parameters.

## Open Questions

Decided: duration control, area as first objective level, divisions as pills on cards, Formato/Foco grouping. Remaining: per-value icons for effort, and the table view (proposed: same pills).
