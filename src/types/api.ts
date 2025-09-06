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

// Activities API Types
export interface ApiActivity {
  id: string;
  name: string;
  description: string;
  materials: string;
  approximate_duration_minutes: number;
  group_size: string; // API returns string, not union type
  effort_level: string; // API returns string, not union type
  location: string; // API returns string, not union type
  age_group: string; // API returns string, not union type
  image_url?: string;
  created_at: string;
  activity_type: {
    id: string;
    name: string;
  };
  educational_goals: Array<{
    id: string;
    title: string;
    code: string;
  }>;
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
export interface ApiActivityType {
  id: string;
  name: string;
}

export interface ApiEducationalGoal {
  id: string;
  title: string;
  code: string;
  area: string;
}

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
  activityType?: string[];
  sdgs?: string[];
  educationalGoals?: string[];
  durationMin?: number;
  durationMax?: number;
  durationOperator?: string;
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
      location?: string;
      age_group?: string[];
      activity_type?: string[];
      sdgs?: string[];
      educational_goals?: string[];
      duration_min?: string;
      duration_max?: string;
      duration_operator?: string;
    };
    available: {
      group_sizes: string[];
      effort_levels: string[];
      locations: string[];
      age_groups: string[];
      activity_types: string[];
    };
  };
}
