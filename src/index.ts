/**
 * Scout Toolkit - Main Entry Point
 * 
 * This file serves as the main entry point for TypeDoc documentation generation.
 * It re-exports all the main modules and components of the application.
 */

// Core utilities and constants
export * from './lib/utils';
export * from './lib/constants';

// Error handling system
export * from './lib/errors/error-handler';
export * from './lib/errors/api-error-handler';
export * from './lib/errors/error-logger';
export * from './lib/errors/error-messages';
export * from './lib/errors/error-boundary';

// Validation system
export * from './lib/validation';

// Query client and hooks
export * from './lib/query-client';
export * from './hooks/queries/useActivities';
export * from './hooks/queries/useActivity';
export * from './hooks/queries/usePrograms';
export * from './hooks/queries/useProgram';
export * from './hooks/mutations/useProgramMutations';
export * from './hooks/queries/useQueryInvalidation';

// Providers
export * from './components/providers/QueryProvider';

// UI Components
export * from './components/ui/IconDisplay';

// Feature Components - Activities
export { ActivityFilters } from './components/features/activities/ActivityFilters';
export * from './components/features/activities/ActivityRating';
export * from './components/features/activities/ActivitiesTable';

// Feature Components - Programs
export * from './components/features/programs/ProgramForm';
export * from './components/features/programs/ProgramBuilder';
export * from './components/features/programs/ProgramCard';
export { ProgramSummary as ProgramSummaryComponent } from './components/features/programs/ProgramSummary';
export * from './components/features/programs/ProgramScheduleTable';
export * from './components/features/programs/ProgramScheduleRow';
export * from './components/features/programs/ProgramEntryCard';
export * from './components/features/programs/AddActivityModal';
export * from './components/features/programs/AddCustomBlockModal';
export * from './components/features/programs/DeleteProgramModal';

// Types
export * from './types/errors';
