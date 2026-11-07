## Context

**Findings** (local database, 97 approved activities, and the sheet's `tipos` tab and `Tipo` column):

| Type | Activities | Reading |
| --- | --- | --- |
| Jogo | 70 (72%) | Present on almost everything; it describes the *format*, so as a filter it removes little. |
| Cooperação | 34 | Strong focus tag, usually together with Jogo or Desafio. |
| Desafio | 25 | Format and focus at once (a challenge with a goal). |
| Técnica | 21 | Scouting skills (knots, orientation, signals); usually with Jogo or Desafio. |
| Quebra-Gelo | 14 | An opener; often stand-alone. |
| Aventura | 7 | Outdoor, patrol-sized games. |
| Reflexão | 7 | Debriefing and debate dynamics, mostly stand-alone. |
| Liderança | 7 | Small, always combined with another type. |
| Criatividade | 6 | Small. |
| Serviço | 0 | On the sheet's list but unused in every row read. |
| "Tipo E2E …" ×5 | 0 | Test leftovers in the local database. |

Frequent combinations: Jogo (alone) 20; Cooperação + Jogo 12; Jogo + Técnica 7; Cooperação + Desafio 6; Aventura + Jogo 6; Jogo + Quebra-Gelo 6.

**Current model.** `activity_types (id, name, description, created_at)`. Seeds create a handful of names; the baseline loader matches `Tipo` text to existing rows by name and never creates types; the admin taxonomies API lets an admin rename or delete any row; activities link to types through `activity_activity_types` (restrict on delete).

## Goals / Non-Goals

**Goals:**

- One official list that exists in every environment and cannot be changed by accident.
- Metadata (description, group, order) so the editor and the filter can present types well.
- Counts of approved activities per type for the filter.
- No test data in a real catalogue.

**Non-Goals:**

- No renaming of the sheet's words, and no new types beyond the ten.
- No change to the rule that an activity has one or more types.
- No hierarchy of types (a type has one group, not a tree).
- No change to the filter UI itself (see `catalogue-filters-refresh`).

## Decisions

**D1. Types become managed reference data.**
`activity_types` gains `code` (unique, upper-case, for example `JOGO`), `kind` (`format | focus`), `position` and `is_managed`. A committed `activity-types.json` and an idempotent `applyActivityTypes` (upsert by code, write only differing rows, `is_managed = true`) are called from the same four places as the Matriz and the sources loaders. The migration backfills `code` and the metadata for the ten existing names, so Preview and Production keep their ids and every activity link.
*Alternative:* keep free-form rows and rely on convention. Rejected: that is how test types and drift entered.

**D2. Managed types are read-only; admins may add their own.**
Update or delete of a managed type answers 409 (same rule as managed Matriz rows). An admin-created type has `is_managed = false`, no code is required, it sorts after the official ones and appears in the "Outros" group.

**D3. Two groups, drafted for review.**
*Formato*: Jogo, Desafio, Aventura, Quebra-Gelo. *Foco*: Cooperação, Criatividade, Técnica, Liderança, Reflexão, Serviço. The group is metadata only; an activity can mix types across groups, and filters combine types with OR as today.
*Alternative:* three groups with Quebra-Gelo as "Momento". Left as an open question: cheap to change because it is data.

**D4. Draft descriptions** (one line each, Portuguese, for the content team to edit):

- Jogo: atividade lúdica com regras simples, para jogar em equipa ou individualmente.
- Quebra-Gelo: dinâmica curta para o grupo se conhecer, aquecer ou ganhar energia.
- Desafio: prova com um objetivo claro e, muitas vezes, tempo ou pontuação.
- Reflexão: conversa ou debate orientado para pensar no que se viveu e nos valores.
- Criatividade: atividade para inventar, desenhar, representar ou imitar.
- Cooperação: tarefa que só se resolve se o grupo trabalhar em conjunto.
- Liderança: atividade que exercita decidir, coordenar e motivar os outros.
- Aventura: jogo ou percurso ao ar livre, normalmente por patrulhas.
- Serviço: atividade em benefício da comunidade ou do ambiente.
- Técnica: prática de uma técnica escotista (nós, orientação, sinais, pioneirismo…).

**D5. Counts and hiding empty types in the read API.**
`GET /api/taxonomies/activity-types` returns each type with `code`, `description`, `kind`, `position`, `is_managed` and `activity_count` (approved activities only). The public filter hides types with `activity_count = 0`; the editor and admin lists show all. Counting is one grouped query over `activity_activity_types` joined to approved activities.

**D6. Cleanup is explicit and local-first.**
The loader never deletes unmanaged rows. The five "Tipo E2E …" rows are removed from the local database by a reviewed one-off statement run only after confirmation (they have no activity links). The e2e specs that create types now create them inside their own run and delete them in `afterAll`, or use a name prefix the cleanup helper recognises.

**D7. Import matching.**
`Tipo` cells are split as today and each value matched to a type by normalised name **or code**; a value with no match is reported in `droppedValues` and does not create a type.

## Risks / Trade-offs

- **Hiding zero-count types** means a newly approved activity of an empty type makes the type appear: acceptable and expected.
- **Counts add a query** to a page-load endpoint: one grouped query on small tables; cached by TanStack Query like the other taxonomies.
- **Backfill by name** assumes the ten names are spelled as on the sheet; the migration matches case- and accent-insensitively and leaves unknown rows as unmanaged with no code.
- **Group choice is opinion**: it is data, not code, and the proposal flags it for the content team.

## Migration Plan

1. Edit the schema, `npm run db:generate` (ask first), review the SQL (additive columns, unique code allowing null, backfill `UPDATE … WHERE lower(unaccent(name)) = …`), commit.
2. Local: after approval, `db:migrate`, `db:load-reference`, then the reviewed cleanup of the five test types.
3. Preview, then Production: the deploy hook applies the migration and the loader; no activity link changes.
4. Rollback: additive columns can stay; the loader can be skipped.

## Open Questions

Decided: two groups, Formato and Foco. Pending the product owner's review of the activity list: the final assignment of types to groups, what happens to Jogo and Serviço, and the wording of the descriptions.
