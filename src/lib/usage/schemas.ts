import { z } from 'zod';

const idList = z.array(z.string().trim().min(1).max(64)).max(50);

export const searchFiltersSchema = z
  .object({
    ageGroup: idList,
    groupSize: idList,
    effortLevel: idList,
    location: idList,
    activityType: idList,
    sdgs: idList,
    educationalGoals: idList,
    educationalAreas: idList,
    generalObjectives: idList,
    durationMin: z.string().max(6),
    durationMax: z.string().max(6),
  })
  .partial();

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

/** Only these two types may come from the browser; program_add is recorded by the server. */
export const usageEventBodySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('search'),
    text: z.string().trim().max(200).default(''),
    filters: searchFiltersSchema.default({}),
    result_count: z.number().int().min(0).max(1_000_000),
  }),
  z.object({
    type: z.literal('activity_view'),
    activity_id: z.string().uuid(),
  }),
]);

export type UsageEventBody = z.infer<typeof usageEventBodySchema>;

/** True when a search has neither text nor any filter, so there is nothing to record. */
export function isEmptySearch(text: string, filters: SearchFilters): boolean {
  if (text.trim()) return false;
  return !Object.values(filters).some((value) => (Array.isArray(value) ? value.length > 0 : Boolean(value)));
}
