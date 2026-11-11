// Closed value lists for the enum-valued activity categories.
// Single source of truth for Drizzle columns, Zod schemas and UI options.
export const GROUP_SIZE_VALUES = ['small', 'medium', 'large'] as const;
export const LOCATION_VALUES = ['inside', 'outside'] as const;
export const AGE_GROUP_VALUES = ['cub_scouts', 'scouts', 'adventurers', 'rovers', 'leaders'] as const;

// Five levels, as in the reference sheet: Baixo, Baixo a médio, Médio, Médio a alto, Alto.
export const RISK_LEVEL_VALUES = ['low', 'low_medium', 'medium', 'medium_high', 'high'] as const;

export type RiskLevelValue = (typeof RISK_LEVEL_VALUES)[number];
export type GroupSizeValue = (typeof GROUP_SIZE_VALUES)[number];
export type LocationValue = (typeof LOCATION_VALUES)[number];
export type AgeGroupValue = (typeof AGE_GROUP_VALUES)[number];
