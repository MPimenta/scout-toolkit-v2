## Context

The sheet (`atividades` tab, 29 columns, ~916 activity ids) was inspected through its headers and the first ~70 rows; full fill-rate numbers are a deliverable of the loader's report, not assumptions here. The product now stores several values per activity for group size, location, age group and activity type (change `multi-value-activity-categories`), which matches how the sheet lists them. Educational goals in the product are seeded as codes like `SOCIAL_TEAM` (22 rows); the sheet uses the national matrix codes (`1A`, `2A.2`, `4F.3.1`) and also carries "desafios" and a risk-analysis column that have no home in the schema. The private sheet cannot be fetched anonymously, so the loader works from an exported file.

## Goals / Non-Goals

**Goals:** a realistic ~200-activity baseline, a repeatable and safe loader, and a report that tells us what to fix in the sheet and in the schema.
**Non-Goals:** in-app import UI, linking educational goals/desafios, image handling, live Google API access, any further schema change.

## Decisions

1. **Script plus a pure mapping module, not an API.** `src/lib/activities/baseline-map.ts` holds parse/normalise functions (unit-testable, reusable by the later Excel import); `scripts/load-baseline-activities.ts` handles file IO, selection, DB writes and the report. Writes go through `parseActivityWrite`/`createActivity`.
2. **Input is an exported file.** The user exports the `atividades` tab (and the small `ods`/`valores` tabs if needed) to CSV/XLSX under an untracked folder (`data/`, added to `.gitignore`). No Google credentials in the repo.
3. **Multi-valued cells become lists.** `Tipo`, `Local`, `Grupo` and `Divisão` are split on `,`/`;`/newline, each value is matched to the accepted set (labels or keys, accents and case ignored) and every recognised value is kept. Unrecognised values are dropped and reported; a row with nothing recognised in a category is invalid. Section names follow the seed order: Lobitos = cub_scouts, Escoteiros = scouts, Exploradores (alias Pioneiros) = adventurers, Caminheiros = rovers, Dirigentes = leaders. Confirmed by the Regulamento: Exploradores are 14–17.
4. **Selection:** validate all rows first, then pick ~200 round-robin across `Fonte` x first age group with a fixed-seed shuffle inside each bucket. Default limit 200, configurable.
5. **Duplicates:** same normalised name and at least one shared age group, so both paths can agree.
6. **Replace safety:** local DB host check, `--dry-run`, `--replace` refuses when program entries reference activities unless `--force`, which uses the existing "null the references" behaviour. Per CLAUDE.md, running the loader against any database is a data change and is done only on request.
6a. **Header-driven parsing.** The exported headers are matched by normalised name (accents, case and punctuation ignored) through an alias table, so small renames in the sheet do not break the load; missing required columns fail with the list of what was expected.
7. **Educational goals are not loaded.** No mapping exists between matrix codes and `educational_goals`. The report lists unmapped codes and counts; a follow-up change should either seed the matrix v1.1 objectives or add a mapping table. The `mapeamento` tab (per-activity code, division, justification) is the likely source for that follow-up.
8. **Licences:** the `fontes` tab shows mixed terms (some copyrighted or unstated, one paid). The committed test fixture only includes rows from sources marked open/public domain; everything else stays in the untracked local snapshot. *Needs an owner decision.*
9. **Relation to `admin-activity-excel-import` (0/4 tasks):** that change assumes a template layout of its own (enum keys, goal codes, SDG numbers). The real sheet differs (labels, lists, ranges, SDG names). After this load, that change should be revised to accept the real layout and reuse `baseline-map.ts` instead of defining a second parser.

## Gaps found so far (sheet vs product)

| Topic | Observation | Suggested fix at the source |
|---|---|---|
| Multi-valued cells | `Grupo`, `Local`, `Tipo`, `Divisão` hold several values | Now supported by the product; keep one comma-separated list per cell using the accepted labels |
| Duration | `Mins` mixes `15`, `15-30`, `20min`, `20/30 min`, `1h`, blanks | One integer column; the `duracao_min`/`duracao_max` columns already exist but are empty |
| Blank mandatory fields | Some rows lack `Mins`, `Grupo`, `Esforço`, `Local`, `Tipo` entirely | Make them required before an activity is marked ready; use the existing `estado`/`revisor` columns |
| Instructions column | Header is `Intruções?` (typo and a question mark); a placeholder `-` is used for empty | Rename to `Instruções`; leave empty instead of `-` (same for `Materiais`) |
| Educational goals | Full text with matrix codes, separated by commas that also occur inside the text | Store codes only, one per cell or one row per code (the `mapeamento` tab already does this) |
| Goal taxonomy | Matrix codes (`2A.2`) have no counterpart in `educational_goals` (`SOCIAL_TEAM`...) | Align taxonomies (separate change) |
| Desafios, Análise de Risco | No table/column in the product | Decide if they are in scope; otherwise drop from the load sheet |
| Source and licence | `Fonte` and `link_fonte` exist, product has nowhere to show attribution | Decide on an attribution field before publishing copyrighted material |
| Images | `Imagem URL` empty in samples | Out of scope for the test baseline |
| Row hygiene | Blank rows inside the data (between ATV-0019 and ATV-0020); an "exemplo" row at the top | Remove the example row and gaps, or mark with `estado` |
| Ids | `atividade_id` is stable (`ATV-0001`...) | Keep; the loader can use it as an external key in the report |

## Risks / Trade-offs

- Unrecognised values in list cells are dropped; mitigated by reporting exactly what was dropped and by treating this load as a test baseline, not production content.
- Replacing the catalogue removes activities referenced by programs, ratings or reviews; mitigated by the reference check and the `--force` gate.
- Committing copyrighted text would be a legal problem; mitigated by decision 8.

## Migration Plan

No schema change. Rollback is re-running the existing demo seed (`db:seed`, ask first) or restoring the local database.

## Open Questions

- Is the sheet's "Exploradores" the 10-14 section (scouts) and "Pioneiros" the 14+ one (adventurers)? (decision 3)
- Which sources may be committed as fixtures (decision 8)?
- Is `estado` in the sheet usable as a "ready/approved" filter, or should selection ignore it?
