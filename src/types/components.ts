// Component Props Types
// These types define the props for React components

import { ReactNode } from 'react';
import { type ClassValue } from 'clsx';

// Base component props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Activity component props
export interface ActivityCardProps extends BaseComponentProps {
  activity: {
    id: string;
    name: string;
    description: string;
    materials: string;
    approximate_duration_minutes: number;
    group_size: string;
    effort_level: string;
    location: string;
    age_group: string;
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
  };
}

export interface ActivityDetailProps extends BaseComponentProps {
  activityId: string;
}

// Program component props
export interface ProgramCardProps extends BaseComponentProps {
  program: {
    id: string;
    name: string;
    date?: string;
    start_time: string;
    user_id: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface ProgramBuilderProps extends BaseComponentProps {
  programId: string;
}

export interface ProgramSummaryProps extends BaseComponentProps {
  program: {
    id: string;
    name: string;
    start_time: string;
    entries: Array<{
      id: string;
      position: number;
      start_time: string;
      end_time: string;
      entry_type: 'activity' | 'custom';
      activity_id?: string;
      custom_title?: string;
      custom_duration_minutes?: number;
      activity?: {
        id: string;
        name: string;
        approximate_duration_minutes: number;
        group_size: string;
        effort_level: string;
        location: string;
        age_group: string;
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
      };
    }>;
  };
}

export interface ProgramScheduleTableProps extends BaseComponentProps {
  program: {
    id: string;
    name: string;
    start_time: string;
    entries: Array<{
      id: string;
      position: number;
      start_time: string;
      end_time: string;
      entry_type: 'activity' | 'custom';
      activity_id?: string;
      custom_title?: string;
      custom_duration_minutes?: number;
      activity?: {
        id: string;
        name: string;
        description: string;
        materials: string;
        approximate_duration_minutes: number;
        group_size: string;
        effort_level: string;
        location: string;
        age_group: string;
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
      };
    }>;
  };
  onReorder: (entries: Array<{ id: string; position: number }>) => void;
  onDelete: (entryId: string) => void;
  onEdit: (entryId: string) => void;
}

// Filter component props
export interface ActivityFiltersProps extends BaseComponentProps {
  onFiltersChange: (filters: FilterState) => void;
  availableFilters: {
    activity_types: string[];
    sdgs: Array<{
      id: string;
      number: number;
      name: string;
      icon_url?: string;
      icon?: string;
    }>;
    educational_goals: Array<{
      id: string;
      title: string;
      code: string;
    }>;
  };
}

// Modal component props
export interface AddToProgramModalProps extends BaseComponentProps {
  activityId: string;
  isOpen: boolean;
  onClose: () => void;
}

export interface AddActivityModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onAddActivity: (activityId: string) => void;
}

export interface AddCustomBlockModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomBlock: (data: { title: string; duration: number }) => void;
}

export interface DeleteProgramModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  programName: string;
}

// Form component props
export interface ProgramFormProps extends BaseComponentProps {
  program?: {
    id: string;
    name: string;
    date?: string;
    start_time: string;
    is_public: boolean;
  };
  onSubmit: (data: {
    name: string;
    date?: string;
    start_time: string;
    is_public: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Filter state type
export interface FilterState {
  search: string;
  activityType: string[];
  sdgs: string[];
  educationalGoals: string[];
  durationMin: number;
  durationMax: number;
  durationOperator: string;
  groupSize: string[];
  effortLevel: string[];
  location: string[];
  ageGroup: string[];
}

// Utility types
export type ClassNameValue = ClassValue;
