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
  sdgs
} from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  isUser,
  isActivity,
  isProgram,
  isProgramEntry,
  isApiActivity,
  isApiProgram,
  isApiProgramEntry,
  isUserArray,
  isActivityArray,
  isProgramArray,
  isProgramEntryArray,
  isApiActivityArray,
  isApiProgramArray,
  isApiProgramEntryArray,
} from '@/types/guards';

describe('Type Validation Integration Tests', () => {
  describe('Database Entity Type Validation', () => {
    it('should validate user entities from database', async () => {
      await withTestDatabase(async () => {
        // Create a test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Fetch user from database
        const fetchedUser = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
        
        expect(fetchedUser).toHaveLength(1);
        expect(isUser(fetchedUser[0])).toBe(true);
        
        // Test with invalid data
        const invalidUser = { ...fetchedUser[0], role: 'invalid_role' };
        expect(isUser(invalidUser)).toBe(false);
      });
    });

    it('should validate activity entities from database', async () => {
      await withTestDatabase(async () => {
        // Create test activity type
        const [activityType] = await db.insert(activityTypes).values({
          name: 'Test Activity Type',
        }).returning();

        // Create a test activity
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

        // Fetch activity from database
        const fetchedActivity = await db.select().from(activities).where(eq(activities.id, activity.id)).limit(1);
        
        expect(fetchedActivity).toHaveLength(1);
        expect(isActivity(fetchedActivity[0])).toBe(true);
        
        // Test with invalid data
        const invalidActivity = { ...fetchedActivity[0], group_size: 'invalid_size' };
        expect(isActivity(invalidActivity)).toBe(false);
      });
    });

    it('should validate program entities from database', async () => {
      await withTestDatabase(async () => {
        // Create a test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Create a test program
        const [program] = await db.insert(programs).values({
          name: 'Test Program',
          start_time: '09:00',
          user_id: user.id,
          is_public: true,
        }).returning();

        // Fetch program from database
        const fetchedProgram = await db.select().from(programs).where(eq(programs.id, program.id)).limit(1);
        
        expect(fetchedProgram).toHaveLength(1);
        expect(isProgram(fetchedProgram[0])).toBe(true);
        
        // Test with invalid data
        const invalidProgram = { ...fetchedProgram[0], is_public: 'invalid' };
        expect(isProgram(invalidProgram)).toBe(false);
      });
    });

    it('should validate program entry entities from database', async () => {
      await withTestDatabase(async () => {
        // Create a test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Create a test program
        const [program] = await db.insert(programs).values({
          name: 'Test Program',
          start_time: '09:00',
          user_id: user.id,
          is_public: true,
        }).returning();

        // Create a test program entry
        const [entry] = await db.insert(programEntries).values({
          program_id: program.id,
          position: 1,
          start_time: '09:00',
          end_time: '10:00',
          entry_type: 'custom',
          custom_title: 'Test Entry',
          custom_duration_minutes: 60,
        }).returning();

        // Fetch program entry from database
        const fetchedEntry = await db.select().from(programEntries).where(eq(programEntries.id, entry.id)).limit(1);
        
        expect(fetchedEntry).toHaveLength(1);
        expect(isProgramEntry(fetchedEntry[0])).toBe(true);
        
        // Test with invalid data
        const invalidEntry = { ...fetchedEntry[0], entry_type: 'invalid_type' };
        expect(isProgramEntry(invalidEntry)).toBe(false);
      });
    });
  });

  describe('API Response Type Validation', () => {
    it('should validate API activity responses', async () => {
      await withTestDatabase(async () => {
        // Create test activity type
        const [activityType] = await db.insert(activityTypes).values({
          name: 'Test Activity Type',
        }).returning();

        // Create a test activity
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

        // Simulate API response structure
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
        
        // Test with invalid API response
        const invalidApiResponse = { ...apiResponse, group_size: 123 };
        expect(isApiActivity(invalidApiResponse)).toBe(false);
      });
    });

    it('should validate API program responses', async () => {
      await withTestDatabase(async () => {
        // Create a test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Create a test program
        const [program] = await db.insert(programs).values({
          name: 'Test Program',
          start_time: '09:00',
          user_id: user.id,
          is_public: true,
        }).returning();

        // Simulate API response structure
        const apiResponse = {
          id: program.id,
          name: program.name,
          start_time: program.start_time,
          is_public: program.is_public,
          created_at: program.created_at.toISOString(),
          updated_at: program.updated_at.toISOString(),
          entry_count: 0,
          total_duration_minutes: 0,
        };

        expect(isApiProgram(apiResponse)).toBe(true);
        
        // Test with invalid API response
        const invalidApiResponse = { ...apiResponse, is_public: 'invalid' };
        expect(isApiProgram(invalidApiResponse)).toBe(false);
      });
    });
  });

  describe('Array Type Validation', () => {
    it('should validate user arrays from database', async () => {
      await withTestDatabase(async () => {
        // Create test users
        const [user1] = await db.insert(users).values({
          email: 'test1@example.com',
          name: 'Test User 1',
          role: 'user',
        }).returning();

        const [user2] = await db.insert(users).values({
          email: 'test2@example.com',
          name: 'Test User 2',
          role: 'admin',
        }).returning();

        // Fetch users from database
        const fetchedUsers = await db.select().from(users).where(eq(users.id, user1.id).or(eq(users.id, user2.id)));
        
        expect(fetchedUsers).toHaveLength(2);
        expect(isUserArray(fetchedUsers)).toBe(true);
        
        // Test with invalid array
        const invalidUsers = [{ ...fetchedUsers[0], role: 'invalid_role' }];
        expect(isUserArray(invalidUsers)).toBe(false);
      });
    });

    it('should validate activity arrays from database', async () => {
      await withTestDatabase(async () => {
        // Create test activity type
        const [activityType] = await db.insert(activityTypes).values({
          name: 'Test Activity Type',
        }).returning();

        // Create test activities
        const [activity1] = await db.insert(activities).values({
          name: 'Test Activity 1',
          description: 'Test Description 1',
          materials: 'Test Materials 1',
          approximate_duration_minutes: 60,
          group_size: 'small',
          effort_level: 'medium',
          location: 'inside',
          age_group: 'scouts',
          activity_type_id: activityType.id,
          is_approved: true,
        }).returning();

        const [activity2] = await db.insert(activities).values({
          name: 'Test Activity 2',
          description: 'Test Description 2',
          materials: 'Test Materials 2',
          approximate_duration_minutes: 90,
          group_size: 'large',
          effort_level: 'high',
          location: 'outside',
          age_group: 'adventurers',
          activity_type_id: activityType.id,
          is_approved: true,
        }).returning();

        // Fetch activities from database
        const fetchedActivities = await db.select().from(activities).where(eq(activities.id, activity1.id).or(eq(activities.id, activity2.id)));
        
        expect(fetchedActivities).toHaveLength(2);
        expect(isActivityArray(fetchedActivities)).toBe(true);
        
        // Test with invalid array
        const invalidActivities = [{ ...fetchedActivities[0], group_size: 'invalid_size' }];
        expect(isActivityArray(invalidActivities)).toBe(false);
      });
    });

    it('should validate program arrays from database', async () => {
      await withTestDatabase(async () => {
        // Create a test user
        const [user] = await db.insert(users).values({
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        }).returning();

        // Create test programs
        const [program1] = await db.insert(programs).values({
          name: 'Test Program 1',
          start_time: '09:00',
          user_id: user.id,
          is_public: true,
        }).returning();

        const [program2] = await db.insert(programs).values({
          name: 'Test Program 2',
          start_time: '14:00',
          user_id: user.id,
          is_public: false,
        }).returning();

        // Fetch programs from database
        const fetchedPrograms = await db.select().from(programs).where(eq(programs.id, program1.id).or(eq(programs.id, program2.id)));
        
        expect(fetchedPrograms).toHaveLength(2);
        expect(isProgramArray(fetchedPrograms)).toBe(true);
        
        // Test with invalid array
        const invalidPrograms = [{ ...fetchedPrograms[0], is_public: 'invalid' }];
        expect(isProgramArray(invalidPrograms)).toBe(false);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined values gracefully', () => {
      expect(isUser(null)).toBe(false);
      expect(isUser(undefined)).toBe(false);
      expect(isActivity(null)).toBe(false);
      expect(isActivity(undefined)).toBe(false);
      expect(isProgram(null)).toBe(false);
      expect(isProgram(undefined)).toBe(false);
      expect(isProgramEntry(null)).toBe(false);
      expect(isProgramEntry(undefined)).toBe(false);
    });

    it('should handle empty objects gracefully', () => {
      expect(isUser({})).toBe(false);
      expect(isActivity({})).toBe(false);
      expect(isProgram({})).toBe(false);
      expect(isProgramEntry({})).toBe(false);
    });

    it('should handle arrays with mixed valid and invalid items', () => {
      const validUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const invalidUser = { id: '2' };

      const mixedArray = [validUser, invalidUser];
      expect(isUserArray(mixedArray)).toBe(false);
    });

    it('should handle deeply nested objects', () => {
      const complexObject = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            description: 'Test Description',
            materials: 'Test Materials',
            approximate_duration_minutes: 60,
            group_size: 'small',
            effort_level: 'medium',
            location: 'inside',
            age_group: 'scouts',
            activity_type_id: '456',
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
            is_approved: true,
          },
        ],
      };

      expect(isUser(complexObject.user)).toBe(true);
      expect(isActivityArray(complexObject.activities)).toBe(true);
    });
  });
});
