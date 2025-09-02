import { type ClassValue } from 'clsx';

// Locale types
export type Locale = 'pt' | 'en';

// Multilingual content type
export type MultilingualContent = {
  pt: string;
  en: string;
};

// Age group types
export type AgeGroup = 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders';

// Group size types
export type GroupSize = 'small' | 'medium' | 'large';

// Effort level types
export type EffortLevel = 'low' | 'medium' | 'high';

// Location types
export type Location = 'inside' | 'outside';

// User role types
export type UserRole = 'user' | 'admin';

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationResponse;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Activity types
export interface Activity {
  id: string;
  name: MultilingualContent;
  description: MultilingualContent;
  materials: MultilingualContent;
  approximate_duration_minutes: number;
  group_size: GroupSize;
  effort_level: EffortLevel;
  location: Location;
  age_group: AgeGroup;
  activity_type_id: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_approved: boolean;
}

// API Response Activity type (what the activities list API actually returns)
export interface ApiActivity {
  id: string;
  name: MultilingualContent;
  description: MultilingualContent;
  materials: MultilingualContent;
  approximate_duration_minutes: number;
  group_size: string; // API returns string, not union type
  effort_level: string; // API returns string, not union type
  location: string; // API returns string, not union type
  age_group: string; // API returns string, not union type
  image_url?: string;
  created_at: string;
  activity_type: {
    id: string;
    name: MultilingualContent;
  };
  educational_goals: Array<{
    id: string;
    title: MultilingualContent;
    code: string;
  }>;
  sdgs: Array<{
    id: string;
    number: number;
    name: MultilingualContent;
    icon_url?: string;
  }>;
}

// Program types
export interface Program {
  id: string;
  name: string;
  date?: string;
  start_time: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgramEntry {
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
}

// Review types
export interface Review {
  id: string;
  activity_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

// Utility types
export type ClassNameValue = ClassValue;

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
