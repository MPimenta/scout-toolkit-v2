/** Types and constants shared by the usage API and the admin page (no server imports). */
export const USAGE_PERIODS = ['7d', '30d', '90d', '13m'] as const;
export type UsagePeriod = (typeof USAGE_PERIODS)[number];
export const NO_DIVISION = 'sem_divisao';

export interface UsageSummary {
  period: UsagePeriod;
  division: string | null;
  from: string;
  totals: { searches: number; views: number; program_adds: number; visitors: number; signed_in_users: number };
  daily: Array<{ date: string; searches: number; views: number; program_adds: number }>;
  top_viewed: ActivityRow[];
  top_added: ActivityRow[];
  top_searches: Array<{ text: string; count: number; avg_results: number }>;
  no_result_searches: Array<{ text: string; count: number }>;
  searches_by_division: Array<{ division: string; count: number }>;
  top_users: Array<{ user_id: string; name: string; searches: number; views: number; program_adds: number }>;
}

export interface ActivityRow {
  activity_id: string;
  name: string;
  views: number;
  adds: number;
  /** additions divided by views; null when there are no views */
  conversion: number | null;
}
