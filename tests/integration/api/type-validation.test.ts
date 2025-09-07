import { describe, it, expect, beforeEach } from 'vitest';
import { withTestDatabase } from '../../helpers/database';
import { db } from '@/lib/db/server';
import { 
  activities, 
  programs, 
  programEntries, 
  users,
  activityTypes,
  educationalGoals,
  sdgs,
  activityEducationalGoals,
  activitySdgs
} from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  isApiActivity,
  isApiProgram,
  isApiProgramEntry,
  isApiActivityArray,
  isApiProgramArray,
  isApiProgramEntryArray,
} from '@/types/guards';

describe('API Response Type Validation', () => {
  describe('Activities API Type Validation', () => {
    it('should validate activities API response structure', async () => {
      await withTestDatabase(async () => {
        // Create test data
        const [activityType] = await db.insert(activityTypes).values({
          name: 'Test Activity Type',
        }).returning();

        const [educationalGoal] = await db.insert(educationalGoals).values({
          title: 'Test Educational Goal',
          code: 'EG001',
          area: 'Test Area',
        }).returning();

        const [sdg] = await db.insert(sdgs).values({
          number: 1,
          name: 'No Poverty',
          description: 'End poverty in all its forms everywhere',
          icon_url: 'https://example.com/sdg1.png',
          icon: '🌱',
        }).returning();

        const [activity] = await db.insert(activities).values({
          name: 'Test Activity',
          description: 'Test Description',
          materials: 'Test Materials',
          approximate_duration_minutes: 60,
          group_size: 'small',
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          activity_type_id: activityType.id,
          is_approved: true,
        }).returning();

        // Link educational goal and SDG to activity
        await db.insert(activityEducationalGoals).values({
          activity_id: activity.id,
          goal_id: educationalGoal.id,
        });

        await db.insert(activitySdgs).values({
          activity_id: activity.id,
          sdg_id: sdg.id,
        });

        // Simulate the actual API response structure
        const apiResponse = {
          activities: [
            {
              id: activity.id,
              name: activity.name,
              description: activity.description,
              materials: activity.materials,
              approximate_duration_minutes: activity.approximate_duration_minutes,
              group_size: activity.group_size,
              effort_level: activity.effort_level,
              location: activity.location,
              age_group: activity.age_group,
              created_at: activity.created_at.toISOString(),
              activity_type: {
                id: activityType.id,
                name: activityType.name,
              },
              educational_goals: [
                {
                  id: educationalGoal.id,
                  title: educationalGoal.title,
                  code: educationalGoal.code,
                },
              ],
              sdgs: [
                {
                  id: sdg.id,
                  number: sdg.number,
                  name: sdg.name,
                  icon_url: sdg.icon_url,
                  icon: sdg.icon,
                },
              ],
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            total_pages: 1,
          },
          filters: {
            applied: {
              search: undefined,
              group_size: undefined,
              effort_level: undefined,
              location: undefined,
              age_group: undefined,
              activity_type: undefined,
              sdgs: undefined,
              educational_goals: undefined,
              duration_min: undefined,
              duration_max: undefined,
              duration_operator: undefined,
            },
            available: {
              group_sizes: ['small'],
              effort_levels: ['medium'],
              locations: ['inside'],
              age_groups: ['scouts'],
              activity_types: [activityType.id],
            },
          },
        };

        // Validate the response structure
        expect(apiResponse.activities).toHaveLength(1);
        expect(isApiActivity(apiResponse.activities[0])).toBe(true);
        expect(isApiActivityArray(apiResponse.activities)).toBe(true);
        
        // Validate pagination structure
        expect(apiResponse.pagination).toHaveProperty('page');
        expect(apiResponse.pagination).toHaveProperty('limit');
        expect(apiResponse.pagination).toHaveProperty('total');
        expect(apiResponse.pagination).toHaveProperty('total_pages');
        
        // Validate filters structure
        expect(apiResponse.filters).toHaveProperty('applied');
        expect(apiResponse.filters).toHaveProperty('available');
      });
    });

    it('should handle activities API response with missing optional fields', async () => {
      await withTestDatabase(async () => {
        // Create test data without educational goals or SDGs
        const [activityType] = await db.insert(activityTypes).values({
          name: 'Test Activity Type',
        }).returning();

        const [activity] = await db.insert(activities).values({
          name: 'Test Activity',
          description: 'Test Description',
          materials: 'Test Materials',
          approximate_duration_minutes: 60,
          group_size: 'small',
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          activity_type_id: activityType.id,
          is_approved: true,
        }).returning();

        // Simulate API response with empty arrays
        const apiResponse = {
          id: activity.id,
          name: activity.name,
          description: activity.description,
          materials: activity.materials,
          approximate_duration_minutes: activity.approximate_duration_minutes,
          group_size: activity.group_size,
          effort_level: activity.effort_level,
          location: activity.location,
          age_group: activity.age_group,
          created_at: activity.created_at.toISOString(),
          activity_type: {
            id: activityType.id,
            name: activityType.name,
          },
          educational_goals: [],
          sdgs: [],
        };

        expect(isApiActivity(apiResponse)).toBe(true);
      });
    });
  });

  describe('Programs API Type Validation', () => {
    it('should validate programs API response structure', async () => {
      await withTestDatabase(async () => {
        // Create test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Create test program
        const [program] = await db.insert(programs).values({
          name: 'Test Program',
          start_time: '09:00',
          user_id: user.id,
          is_public: true,
        }).returning();

        // Simulate the actual API response structure
        const apiResponse = {
          programs: [
            {
              id: program.id,
              name: program.name,
              start_time: program.start_time,
              is_public: program.is_public,
              created_at: program.created_at.toISOString(),
              updated_at: program.updated_at.toISOString(),
              entry_count: 0,
              total_duration_minutes: 0,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            total_pages: 1,
          },
        };

        // Validate the response structure
        expect(apiResponse.programs).toHaveLength(1);
        expect(isApiProgram(apiResponse.programs[0])).toBe(true);
        expect(isApiProgramArray(apiResponse.programs)).toBe(true);
        
        // Validate pagination structure
        expect(apiResponse.pagination).toHaveProperty('page');
        expect(apiResponse.pagination).toHaveProperty('limit');
        expect(apiResponse.pagination).toHaveProperty('total');
        expect(apiResponse.pagination).toHaveProperty('total_pages');
      });
    });

    it('should validate program detail API response structure', async () => {
      await withTestDatabase(async () => {
        // Create test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Create test program
        const [program] = await db.insert(programs).values({
          name: 'Test Program',
          start_time: '09:00',
          user_id: user.id,
          is_public: true,
        }).returning();

        // Create test activity type and activity
        const [activityType] = await db.insert(activityTypes).values({
          name: 'Test Activity Type',
        }).returning();

        const [activity] = await db.insert(activities).values({
          name: 'Test Activity',
          description: 'Test Description',
          materials: 'Test Materials',
          approximate_duration_minutes: 60,
          group_size: 'small',
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          activity_type_id: activityType.id,
          is_approved: true,
        }).returning();

        // Create test program entry
        const [entry] = await db.insert(programEntries).values({
          program_id: program.id,
          position: 1,
          start_time: '09:00',
          end_time: '10:00',
          entry_type: 'activity',
          activity_id: activity.id,
        }).returning();

        // Simulate program detail API response
        const apiResponse = {
          id: program.id,
          name: program.name,
          start_time: program.start_time,
          is_public: program.is_public,
          created_at: program.created_at.toISOString(),
          updated_at: program.updated_at.toISOString(),
          entry_count: 1,
          total_duration_minutes: 60,
          entries: [
            {
              id: entry.id,
              program_id: entry.program_id,
              position: entry.position,
              start_time: entry.start_time,
              end_time: entry.end_time,
              entry_type: entry.entry_type,
              activity_id: entry.activity_id,
              created_at: entry.created_at.toISOString(),
              activity: {
                id: activity.id,
                name: activity.name,
                description: activity.description,
                materials: activity.materials,
                approximate_duration_minutes: activity.approximate_duration_minutes,
                group_size: activity.group_size,
                effort_level: activity.effort_level,
                location: activity.location,
                age_group: activity.age_group,
                created_at: activity.created_at.toISOString(),
                activity_type: {
                  id: activityType.id,
                  name: activityType.name,
                },
                educational_goals: [],
                sdgs: [],
              },
            },
          ],
        };

        // Validate the response structure
        expect(isApiProgram(apiResponse)).toBe(true);
        expect(apiResponse.entries).toHaveLength(1);
        expect(isApiProgramEntry(apiResponse.entries[0])).toBe(true);
        expect(isApiProgramEntryArray(apiResponse.entries)).toBe(true);
      });
    });
  });

  describe('Error Response Type Validation', () => {
    it('should validate error response structure', () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            field: 'name',
            value: '',
            constraint: 'required',
          },
        },
      };

      // Validate error structure
      expect(errorResponse.error).toHaveProperty('code');
      expect(errorResponse.error).toHaveProperty('message');
      expect(errorResponse.error.code).toBe('VALIDATION_ERROR');
      expect(typeof errorResponse.error.message).toBe('string');
    });

    it('should validate different error types', () => {
      const errorTypes = [
        'VALIDATION_ERROR',
        'AUTHENTICATION_ERROR',
        'AUTHORIZATION_ERROR',
        'NOT_FOUND',
        'CONFLICT',
        'INTERNAL_ERROR',
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
      ];

      errorTypes.forEach(errorType => {
        const errorResponse = {
          error: {
            code: errorType,
            message: 'Test error message',
          },
        };

        expect(errorResponse.error.code).toBe(errorType);
        expect(typeof errorResponse.error.message).toBe('string');
      });
    });
  });

  describe('Edge Cases and Malformed Data', () => {
    it('should handle malformed API responses gracefully', () => {
      const malformedResponses = [
        // Missing required fields
        {
          id: '123',
          name: 'Test Activity',
          // Missing other required fields
        },
        // Wrong data types
        {
          id: 123, // Should be string
          name: 'Test Activity',
          description: 'Test Description',
          materials: 'Test Materials',
          approximate_duration_minutes: '60', // Should be number
          group_size: 'small',
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          created_at: '2023-01-01T00:00:00Z',
          activity_type: {
            id: '456',
            name: 'Test Type',
          },
          educational_goals: [],
          sdgs: [],
        },
        // Invalid enum values
        {
          id: '123',
          name: 'Test Activity',
          description: 'Test Description',
          materials: 'Test Materials',
          approximate_duration_minutes: 60,
          group_size: 'invalid_size', // Invalid enum value
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          created_at: '2023-01-01T00:00:00Z',
          activity_type: {
            id: '456',
            name: 'Test Type',
          },
          educational_goals: [],
          sdgs: [],
        },
      ];

      malformedResponses.forEach(response => {
        expect(isApiActivity(response)).toBe(false);
      });
    });

    it('should handle null and undefined values in API responses', () => {
      expect(isApiActivity(null)).toBe(false);
      expect(isApiActivity(undefined)).toBe(false);
      expect(isApiProgram(null)).toBe(false);
      expect(isApiProgram(undefined)).toBe(false);
      expect(isApiProgramEntry(null)).toBe(false);
      expect(isApiProgramEntry(undefined)).toBe(false);
    });

    it('should handle empty arrays in API responses', () => {
      expect(isApiActivityArray([])).toBe(true);
      expect(isApiProgramArray([])).toBe(true);
      expect(isApiProgramEntryArray([])).toBe(true);
    });
  });
});
