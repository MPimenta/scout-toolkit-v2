// Database Entity Types
// These types represent the actual database schema entities

// Core entity types
export type AgeGroup = 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders';
export type GroupSize = 'small' | 'medium' | 'large';
export type EffortLevel = 'low' | 'medium' | 'high';
export type Location = 'inside' | 'outside';
export type UserRole = 'user' | 'admin';

// User entity
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Activity entity
export interface Activity {
  id: string;
  name: string;
  description: string;
  materials: string;
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

// Program entity
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

// Program entry entity
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

// Activity type entity
export interface ActivityType {
  id: string;
  name: string;
}

// Educational goal entity
export interface EducationalGoal {
  id: string;
  title: string;
  code: string;
  area: string;
}

// SDG entity
export interface Sdg {
  id: string;
  number: number;
  name: string;
  description: string;
  icon_url?: string;
  icon?: string;
}

// Review entity
export interface Review {
  id: string;
  activity_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

// Junction table entities
export interface ActivityEducationalGoal {
  activity_id: string;
  educational_goal_id: string;
}

export interface ActivitySdg {
  activity_id: string;
  sdg_id: string;
}
