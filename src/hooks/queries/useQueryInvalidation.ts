import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-client';

/**
 * Hook providing comprehensive query invalidation strategies for cache management
 * @returns Object with various invalidation functions for different scopes
 */
export function useQueryInvalidation() {
  const queryClient = useQueryClient();

  /**
   * Invalidates all activities queries
   */
  const invalidateActivities = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
  }, [queryClient]);

  /**
   * Invalidates a specific activity by ID
   * @param id - The activity ID to invalidate
   */
  const invalidateActivity = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.detail(id) });
  }, [queryClient]);

  /**
   * Invalidates activities list with specific filters
   * @param filters - Optional filters to match for invalidation
   */
  const invalidateActivitiesList = useCallback((filters: Record<string, unknown> = {}) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.list(filters) });
  }, [queryClient]);

  /**
   * Invalidates all programs queries
   */
  const invalidatePrograms = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.all });
  }, [queryClient]);

  /**
   * Invalidates a specific program by ID
   * @param id - The program ID to invalidate
   */
  const invalidateProgram = useCallback((id: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.entries(id) });
  }, [queryClient]);

  /**
   * Invalidates programs list with specific filters
   * @param filters - Optional filters to match for invalidation
   */
  const invalidateProgramsList = useCallback((filters: Record<string, unknown> = {}) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.list(filters) });
  }, [queryClient]);

  /**
   * Invalidates all taxonomy queries
   */
  const invalidateTaxonomies = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.taxonomies.all });
  }, [queryClient]);

  /**
   * Invalidates a specific taxonomy type
   * @param type - The taxonomy type to invalidate
   */
  const invalidateTaxonomy = useCallback((type: 'activity-types' | 'educational-goals' | 'sdgs') => {
    const key = type === 'activity-types' 
      ? queryKeys.taxonomies.activityTypes()
      : type === 'educational-goals'
      ? queryKeys.taxonomies.educationalGoals()
      : queryKeys.taxonomies.sdgs();
    
    queryClient.invalidateQueries({ queryKey: key });
  }, [queryClient]);

  /**
   * Smart invalidation based on context - invalidates related queries intelligently
   * @param context - Context object specifying what to invalidate
   */
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

  /**
   * Clears all query caches (useful for logout or complete refresh)
   */
  const clearAllCaches = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  /**
   * Prefetches related data after mutations for better UX
   * @param context - Context object specifying what to prefetch
   */
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
