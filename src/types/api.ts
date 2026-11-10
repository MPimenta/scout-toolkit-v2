// API Response Types
// These types match the actual API responses from our backend

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationResponse;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * A specific objective (Matriz de Progresso) as embedded in an activity. The catalogue list and
 * the activity detail carry this lean shape; `general_objective` and `description` come only from
 * GET /api/taxonomies/educational-goals, and `area` only from the activity detail.
 */
export interface ApiEducationalGoal {
  id: string;
  code: string;
  title: string;
  /** Age groups the objective belongs to (pills take their colour from these). */
  age_groups: string[];
  area?: { id: string; name: string; icon?: string; code?: string } | null;
}

/** Full shape returned by GET /api/taxonomies/educational-goals. */
export interface ApiTaxonomyGoal extends ApiEducationalGoal {
  description?: string | null;
  is_managed?: boolean;
  general_objective: { id: string; code: string; title: string; path?: string | null } | null;
}

// Activities API Types
/** A format or a focus as embedded in an activity. */
export interface ApiValueRef {
  id: string;
  code: string;
  name: string;
}

export interface ApiActivity {
  id: string;
  name: string;
  description: string;
  materials: string;
  instructions?: string | null;
  approximate_duration_minutes: number;
  duration_min_minutes?: number | null;
  duration_max_minutes?: number | null;
  format?: ApiValueRef | null;
  focus?: ApiValueRef | null;
  secondary_focus?: ApiValueRef | null;
  group_sizes: string[]; // API returns strings, not union types
  effort_level: string; // API returns string, not union type
  locations: string[];
  age_groups: string[];
  image_url?: string;
  created_at: string;
  educational_goals: ApiEducationalGoal[];
  sdgs: Array<{
    id: string;
    number: number;
    name: string;
    icon_url?: string;
    icon?: string;
  }>;
}

export interface ApiActivityDetail extends ApiActivity {
  // Additional fields for detailed activity view
  created_by?: string;
  is_approved: boolean;
  updated_at: string;
}

// Programs API Types
export interface ApiProgram {
  id: string;
  name: string;
  date?: string;
  start_time: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  entry_count: number;
  total_duration_minutes: number;
}

export interface ApiProgramEntry {
  id: string;
  program_id: string;
  position: number;
  start_time: string;
  end_time: string;
  entry_type: 'activity' | 'custom';
  activity_id?: string;
  custom_title?: string;
  custom_duration_minutes?: number;
  created_at: string;
  activity?: ApiActivity; // Populated when entry_type is 'activity'
}

export interface ApiProgramDetail extends ApiProgram {
  entries: ApiProgramEntry[];
}

// Programs list API response
export interface ApiProgramsResponse {
  programs: ApiProgram[];
  pagination: PaginationResponse;
}

// Taxonomy API Types
export interface ApiSdg {
  id: string;
  number: number;
  name: string;
  description: string;
  icon_url?: string;
  icon?: string;
}

// User API Types
export interface ApiUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Filter and Search API Types
export interface ApiFilterState {
  search?: string;
  format?: string[];
  focus?: string[];
  sdgs?: string[];
  educationalGoals?: string[];
  durationMin?: number;
  durationMax?: number;
  groupSize?: string[];
  effortLevel?: string[];
  location?: string[];
  ageGroup?: string[];
}

// Actual API response structure from /api/activities
export interface ApiActivitiesResponse {
  activities: ApiActivity[];
  pagination: PaginationResponse;
  filters: {
    applied: {
      search?: string;
      group_size?: string[];
      effort_level?: string[];
      location?: string[];
      age_group?: string[];
      sdgs?: string[];
      educational_goals?: string[];
      educational_areas?: string[];
      general_objectives?: string[];
      duration_min?: string;
      duration_max?: string;
    };
    available: {
      group_sizes: string[];
      effort_levels: string[];
      locations: string[];
      age_groups: string[];
    };
  };
}
