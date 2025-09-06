import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

// Comprehensive query invalidation strategies
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  // Invalidate all activities queries
  const invalidateActivities = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
  }, [queryClient]);

  // Invalidate specific activity
  const invalidateActivity = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(id) });
  }, [queryClient]);

  // Invalidate activities list with specific filters
  const invalidateActivitiesList = useCallback((filters: Record<string, unknown> = {}) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.list(filters) });
  }, [queryClient]);

  // Invalidate all programs queries
  const invalidatePrograms = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.all });
  }, [queryClient]);

  // Invalidate specific program
  const invalidateProgram = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.entries(id) });
  }, [queryClient]);

  // Invalidate programs list with specific filters
  const invalidateProgramsList = useCallback((filters: Record<string, unknown> = {}) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.list(filters) });
  }, [queryClient]);

  // Invalidate all taxonomies
  const invalidateTaxonomies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies.all });
  }, [queryClient]);

  // Invalidate specific taxonomy
  const invalidateTaxonomy = useCallback((type: 'activity-types' | 'educational-goals' | 'sdgs') => {
    const key = type === 'activity-types' 
      ? queryKeys.taxonomies.activityTypes()
      : type === 'educational-goals'
      ? queryKeys.taxonomies.educationalGoals()
      : queryKeys.taxonomies.sdgs();
    
    queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient]);

  // Smart invalidation based on context
  const invalidateRelatedQueries = useCallback((context: {
    type: 'activity' | 'program' | 'taxonomy';
    id?: string;
    filters?: Record<string, unknown>;
  }) => {
    switch (context.type) {
      case 'activity':
        if (context.id) {
          invalidateActivity(context.id);
        }
        invalidateActivitiesList(context.filters);
        // Activities might affect programs that reference them
        invalidatePrograms();
        break;
      
      case 'program':
        if (context.id) {
          invalidateProgram(context.id);
        }
        invalidateProgramsList(context.filters);
        break;
      
      case 'taxonomy':
        if (context.id) {
          invalidateTaxonomy(context.id as 'activity-types' | 'educational-goals' | 'sdgs');
        } else {
          invalidateTaxonomies();
        }
        // Taxonomy changes might affect activities
        invalidateActivities();
        break;
    }
  }, [invalidateActivity, invalidateActivitiesList, invalidateProgram, invalidateProgramsList, invalidateTaxonomy, invalidateTaxonomies, invalidateActivities, invalidatePrograms]);

  // Clear all caches (useful for logout)
  const clearAllCaches = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  // Prefetch related data after mutations
  const prefetchRelatedData = useCallback(async (context: {
    type: 'activity' | 'program';
    id: string;
  }) => {
    switch (context.type) {
      case 'activity':
        // Prefetch related activities for better UX
        await queryClient.prefetchQuery({
          queryKey: queryKeys.activities.detail(context.id),
          queryFn: async () => {
            const response = await fetch(`/api/activities/${context.id}`);
            return response.json();
          },
          staleTime: 5 * 60 * 1000,
        });
        break;
      
      case 'program':
        // Prefetch program details
        await queryClient.prefetchQuery({
          queryKey: queryKeys.programs.detail(context.id),
          queryFn: async () => {
            const response = await fetch(`/api/programs/${context.id}`);
            return response.json();
          },
          staleTime: 30 * 1000,
        });
        break;
    }
  }, [queryClient]);

  return {
    // Individual invalidation methods
    invalidateActivities,
    invalidateActivity,
    invalidateActivitiesList,
    invalidatePrograms,
    invalidateProgram,
    invalidateProgramsList,
    invalidateTaxonomies,
    invalidateTaxonomy,
    
    // Smart invalidation
    invalidateRelatedQueries,
    
    // Cache management
    clearAllCaches,
    prefetchRelatedData,
  };
}
