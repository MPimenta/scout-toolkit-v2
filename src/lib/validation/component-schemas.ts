// Component Prop Validation Schemas
// Pre-defined Zod schemas for common component prop patterns

import { z } from 'zod';

/**
 * Common prop schemas for reusable component validation
 */
export const componentSchemas = {
  /**
   * Base component props (className, children)
   */
  baseComponent: z.object({
    className: z.string().optional(),
    children: z.any().optional(),
  }),

  /**
   * Component with required ID
   */
  withId: z.object({
    id: z.string().min(1, 'ID is required'),
  }),

  /**
   * Modal component props
   */
  modal: z.object({
    open: z.boolean(),
    onClose: z.function(),
  }),

  /**
   * Form component props
   */
  form: z.object({
    onSubmit: z.function(),
    onCancel: z.function().optional(),
    loading: z.boolean().optional(),
    error: z.string().optional(),
  }),

  /**
   * Activity-related component props
   */
  activity: z.object({
    activity: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      approximate_duration_minutes: z.number(),
      group_size: z.enum(['small', 'medium', 'large']),
      effort_level: z.enum(['low', 'medium', 'high']),
      location: z.enum(['inside', 'outside']),
      age_group: z.enum(['cub_scouts', 'scouts', 'adventurers', 'rovers', 'leaders']),
    }),
  }),

  /**
   * Program-related component props
   */
  program: z.object({
    program: z.object({
      id: z.string(),
      name: z.string(),
      date: z.string(),
      start_time: z.string(),
      is_public: z.boolean(),
      user_id: z.string(),
    }),
  }),

  /**
   * Program entry props
   */
  programEntry: z.object({
    entry: z.object({
      id: z.string(),
      program_id: z.string(),
      position: z.number(),
      entry_type: z.enum(['activity', 'custom']),
      activity_id: z.string().optional(),
      custom_title: z.string().optional(),
      custom_duration_minutes: z.number().optional(),
      start_time: z.string().optional(),
      end_time: z.string().optional(),
    }),
  }),

  /**
   * Filter component props
   */
  filters: z.object({
    filters: z.object({
      search: z.string(),
      groupSize: z.array(z.string()),
      effortLevel: z.array(z.string()),
      location: z.string(),
      ageGroup: z.array(z.string()),
      activityType: z.array(z.string()),
      sdgs: z.array(z.string()),
      educationalGoals: z.array(z.string()),
      durationMin: z.string(),
      durationMax: z.string(),
      durationOperator: z.string(),
    }),
    onFiltersChange: z.function(),
    onClearFilters: z.function(),
  }),

  /**
   * Table component props
   */
  table: z.object({
    data: z.array(z.any()),
    onView: z.function().optional(),
    onEdit: z.function().optional(),
    onDelete: z.function().optional(),
  }),

  /**
   * Card component props
   */
  card: z.object({
    title: z.string(),
    description: z.string().optional(),
    onEdit: z.function().optional(),
    onDelete: z.function().optional(),
  }),

  /**
   * Builder component props
   */
  builder: z.object({
    programId: z.string(),
    initialEntries: z.array(z.any()).optional(),
    onSave: z.function().optional(),
    onRefresh: z.function().optional(),
  }),

  /**
   * Summary component props
   */
  summary: z.object({
    entries: z.array(z.any()),
    activities: z.array(z.any()),
    programStartTime: z.string(),
    totalDuration: z.number(),
  }),
};

/**
 * Specific component schemas
 */
export const specificSchemas = {
  /**
   * ProgramForm component props
   */
  programForm: z.object({
    mode: z.enum(['create', 'edit']),
    initialData: z.object({
      id: z.string(),
      name: z.string().optional(),
      date: z.string().optional(),
      start_time: z.string().optional(),
      is_public: z.boolean().optional(),
    }).optional(),
    onSuccess: z.function().optional(),
  }),

  /**
   * ProgramBuilder component props
   */
  programBuilder: z.object({
    programId: z.string(),
    initialEntries: z.array(z.any()).optional(),
    onSave: z.function().optional(),
    onRefresh: z.function().optional(),
  }),

  /**
   * AddActivityModal component props
   */
  addActivityModal: z.object({
    open: z.boolean(),
    onClose: z.function(),
    programId: z.string(),
  }),

  /**
   * AddCustomBlockModal component props
   */
  addCustomBlockModal: z.object({
    open: z.boolean(),
    onClose: z.function(),
    onAdd: z.function(),
  }),

  /**
   * ActivityFilters component props
   */
  activityFilters: z.object({
    filters: z.object({
      search: z.string(),
      groupSize: z.array(z.string()),
      effortLevel: z.array(z.string()),
      location: z.string(),
      ageGroup: z.array(z.string()),
      activityType: z.array(z.string()),
      sdgs: z.array(z.string()),
      educationalGoals: z.array(z.string()),
      durationMin: z.string(),
      durationMax: z.string(),
      durationOperator: z.string(),
    }),
    onFiltersChange: z.function(),
    onClearFilters: z.function(),
    availableFilters: z.object({
      activity_types: z.array(z.string()),
      sdgs: z.array(z.object({
        id: z.string(),
        number: z.number(),
        name: z.string(),
        icon_url: z.string().optional(),
        icon: z.string().optional(),
      })),
      educational_goals: z.array(z.object({
        id: z.string(),
        title: z.string(),
        code: z.string(),
      })),
    }).optional(),
  }),

  /**
   * ActivitiesTable component props
   */
  activitiesTable: z.object({
    activities: z.array(z.any()),
    onViewActivity: z.function().optional(),
    onEditActivity: z.function().optional(),
    onDeleteActivity: z.function().optional(),
  }),

  /**
   * ActivityRating component props
   */
  activityRating: z.object({
    activityId: z.string(),
  }),

  /**
   * ProgramCard component props
   */
  programCard: z.object({
    program: z.object({
      id: z.string(),
      name: z.string(),
      date: z.string(),
      start_time: z.string(),
      is_public: z.boolean(),
      user_id: z.string(),
    }),
    onEdit: z.function().optional(),
    onDelete: z.function().optional(),
  }),

  /**
   * IconDisplay component props
   */
  iconDisplay: z.object({
    icon: z.string(),
    text: z.string().optional(),
    className: z.string().optional(),
    iconClassName: z.string().optional(),
    textClassName: z.string().optional(),
    fallback: z.string().optional(),
  }),
};

/**
 * Helper function to create a schema with base component props
 */
export function withBaseComponent<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return componentSchemas.baseComponent.merge(schema);
}

/**
 * Helper function to create a schema with ID requirement
 */
export function withId<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return componentSchemas.withId.merge(schema);
}

/**
 * Helper function to create a schema with modal props
 */
export function withModal<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return componentSchemas.modal.merge(schema);
}
