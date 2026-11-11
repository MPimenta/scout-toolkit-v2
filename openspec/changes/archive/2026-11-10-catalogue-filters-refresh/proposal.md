## Why

The catalogue filter panel is where leaders narrow ~100 activities (and growing), and it still looks like a form from before the design system:

- **Faixa Etária** is a column of plain checkboxes, while divisions appear everywhere else as coloured pills (cards, detail, objectives).
- **Group size, effort and location** have no icons in the filter, while the detail page and the cards each use their own, and they disagree: the detail page uses Users / Target / MapPin, the card uses Users / **TrendingUp** / MapPin.
- **Duração** is an operator select (`>=`, `<=`, `=`, `>`, `<`) plus a min and a max field. Nobody needs an operator when there are two bounds, and the data shows why a plain range is enough: durations run from 5 to 240 minutes, the median is 20, and 78% of activities last 30 minutes or less.
- **Objetivos educativos** lists every objective in one long, flat column. With the Matriz there are 174 (about 47 per division, up to 42 in a single area), which is too long to scan.

This change refreshes the filter panel around the brand design system and the Matriz structure, and makes the activity "facts" (duration, group size, effort, location) look the same on every screen.

## What Changes

- **Divisions as pills**: the age-group filter becomes toggle pills in the division colours, with the division name and ages, a clear selected state and keyboard support.
- **One set of fact icons** (Clock, Users, Target, MapPin) used by the detail header, the cards, the table and the filter, via one shared component. The card's TrendingUp goes away.
- **Duration as a range**: a stepped two-handle slider with two minute fields and a readout such as "15–45 min"; both bounds inclusive, either may be open; no operator. The API treats `duration_min` and `duration_max` as inclusive bounds and ignores `duration_operator`.
- **Objectives grouped**: area, then general objective, then specific objective, as collapsible groups with search, counts, selected chips, a tri-state checkbox at group level and division-coloured pills on the leaves. Selecting a group selects "any objective in it", through new `educational_area` and `general_objective` filter parameters, so the request does not carry dozens of ids.
- **Types grouped with counts** (Formato / Foco), hiding types with no activity, using the fields from `activity-types-review`; a flat list is the fallback while those fields are missing.
- **Active-filter chips** use the same icons and pills, and the phone sheet gets the same panel in a single column with sticky search and actions.
- **Cards show divisions as coloured pills** (compact labels), replacing the text line with an icon; the facts keep the shared icons.

## Capabilities

### New Capabilities

- `catalogue-filters`: the structure and behaviour of the catalogue filter panel (divisions, facts, duration, types, objectives, active chips, phone sheet) and the API parameters it uses.
- `activity-facts`: one icon per fact kind and one component, used everywhere facts are shown.

### Modified Capabilities

- `mobile-layout`: the existing "filters open in a sheet on phones" rule now describes the same panel content (stated in `catalogue-filters`; no existing requirement is removed).

## Impact

- UI: `ActivityFilters` (restructured into section components), `ActivityCard`, `ActivityDetail` header, `ActivitiesTable`, new `FactIcon`, `DivisionToggle` (built on `DivisionPill`, the only place division tokens are allowed), `DurationRange`, `ObjectiveFilterTree`.
- API: `GET /api/activities` gains `educational_areas` and `general_objectives` (comma-separated id lists, OR with `educational_goals`), keeps `duration_min` and `duration_max`, and stops using `duration_operator`; docs and types updated.
- Locale: new keys in `pt.json` and `en.json`; the operator labels are removed.
- Depends on: `brand-design-system` (`DivisionPill`, tokens), `progress-matrix-objectives` (areas, general objectives, division-aware objectives), and, for the grouped types, `activity-types-review`.

## Decisions

Confirmed by the product owner:

- **Duration**: stepped slider plus two minute fields and a readout (no operator, no presets for now).
- **Objectives**: grouped tree, with the six *areas* as the first level.
- **Cards**: show the divisions as coloured pills (see `activity-facts`), instead of text with an icon.
- **Types**: grouped as *Formato* and *Foco* (the content of each group is being reviewed with the activity list, see `activity-types-review`).

Still open, not blocking:

- **Per-value icons** for effort (for example intensity bars like the risk level) are not proposed; only the category icon is.
- **Table**: whether the table view also shows divisions as pills (proposed: yes, same component) is left to the implementation review.
