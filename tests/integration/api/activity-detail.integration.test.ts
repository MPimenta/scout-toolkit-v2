import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { insertActivities } from '../../helpers/activity-categories'
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs, educationalAreas } from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';

describe('Activity Detail API Integration', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe('GET /api/activities/[id]', () => {
    // Note: These tests need to be rewritten to test the actual API logic
    // rather than making HTTP requests, which don't work in test environment
    it.skip('returns 400 when no activity ID is provided', async () => {
      const response = await fetch('/api/activities/');
      expect(response.status).toBe(404); // Next.js will return 404 for invalid routes
    });

    it.skip('returns 404 when activity does not exist', async () => {
      const response = await fetch('/api/activities/non-existent-id');
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Activity not found');
    });

    it.skip('returns complete activity data with all related information', async () => {
      // Create test data
      const activityType = await db.insert(activityTypes).values({
        name: 'Tipo de Atividade',
        description: 'Descrição do tipo',
      }).returning();

      const educationalArea = await db.insert(educationalAreas).values({
        name: 'Área Educativa',
        description: 'Descrição da área',
        icon: '🎯',
        code: 'AREA_1',
      }).returning();

      const educationalGoal = await db.insert(educationalGoals).values({
        area_id: educationalArea[0].id,
        title: 'Objetivo Educativo',
        description: 'Descrição do objetivo',
        code: 'GOAL_1',
      }).returning();

      const sdg = await db.insert(sdgs).values({
        number: 1,
        name: 'Erradicar a Pobreza',
        description: 'Acabar com a pobreza',
        icon_url: 'https://example.com/sdg-1.png',
      }).returning();

      const activity = await insertActivities(db, {
        name: 'Atividade de Teste',
        description: 'Descrição da atividade',
        materials: 'Materiais necessários',
        approximate_duration_minutes: 60,
        group_sizes: ['medium'],
        effort_level: 'medium',
        locations: ['outside'],
        age_groups: ['scouts'],
        image_url: 'https://example.com/test.jpg',
        activity_type_id: activityType[0].id,
      });

      // Create relationships
      await db.insert(activityEducationalGoals).values({
        activity_id: activity[0].id,
        goal_id: educationalGoal[0].id,
        age_group: 'scouts',
      });

      await db.insert(activitySdgs).values({
        activity_id: activity[0].id,
        sdg_id: sdg[0].id,
      });

      // Test the API endpoint
      const response = await fetch(`/api/activities/${activity[0].id}`);
      expect(response.status).toBe(200);

      const data = await response.json();

      // Check main activity data
      expect(data.id).toBe(activity[0].id);
      expect(data.name).toBe('Atividade de Teste');
      expect(data.name.en).toBe('Test Activity');
      expect(data.description).toBe('Descrição da atividade');
      expect(data.materials).toBe('Materiais necessários');
      expect(data.approximate_duration_minutes).toBe(60);
      expect(data.group_size).toBe('medium');
      expect(data.effort_level).toBe('medium');
      expect(data.location).toBe('outside');
      expect(data.age_group).toBe('scouts');
      expect(data.image_url).toBe('https://example.com/test.jpg');

      // Check activity type
      expect(data.activity_type.id).toBe(activityType[0].id);
      expect(data.activity_type.name).toBe('Tipo de Atividade');

      // Check educational goals
      expect(data.educational_goals).toHaveLength(1);
      expect(data.educational_goals[0].id).toBe(educationalGoal[0].id);
      expect(data.educational_goals[0].title).toBe('Objetivo Educativo');
      expect(data.educational_goals[0].area.id).toBe(educationalArea[0].id);
      expect(data.educational_goals[0].area.name).toBe('Área Educativa');
      expect(data.educational_goals[0].area.icon).toBe('🎯');
      expect(data.educational_goals[0].area.code).toBe('AREA_1');

      // Check SDGs
      expect(data.sdgs).toHaveLength(1);
      expect(data.sdgs[0].id).toBe(sdg[0].id);
      expect(data.sdgs[0].number).toBe(1);
      expect(data.sdgs[0].name).toBe('Erradicar a Pobreza');
      expect(data.sdgs[0].icon_url).toBe('https://example.com/sdg-1.png');
    });

    it.skip('handles activities without educational goals gracefully', async () => {
      // Create test data without educational goals
      const activityType = await db.insert(activityTypes).values({
        name: 'Tipo de Atividade',
      }).returning();

      const activity = await insertActivities(db, {
        name: 'Atividade Simples',
        description: 'Descrição simples',
        materials: 'Materiais básicos',
        approximate_duration_minutes: 30,
        group_sizes: ['small'],
        effort_level: 'low',
        locations: ['inside'],
        age_groups: ['cub_scouts'],
        activity_type_id: activityType[0].id,
      });

      const response = await fetch(`/api/activities/${activity[0].id}`);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.educational_goals).toHaveLength(0);
      expect(data.sdgs).toHaveLength(0);
    });

    it.skip('handles activities without SDGs gracefully', async () => {
      // Create test data without SDGs
      const activityType = await db.insert(activityTypes).values({
        name: 'Tipo de Atividade',
      }).returning();

      const activity = await insertActivities(db, {
        name: 'Atividade Sem ODS',
        description: 'Descrição sem ODS',
        materials: 'Materiais sem ODS',
        approximate_duration_minutes: 45,
        group_sizes: ['large'],
        effort_level: 'high',
        locations: ['outside'],
        age_groups: ['rovers'],
        activity_type_id: activityType[0].id,
      });

      const response = await fetch(`/api/activities/${activity[0].id}`);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.sdgs).toHaveLength(0);
    });

    it.skip('handles activities without image gracefully', async () => {
      // Create test data without image
      const activityType = await db.insert(activityTypes).values({
        name: 'Tipo de Atividade',
      }).returning();

      const activity = await insertActivities(db, {
        name: 'Atividade Sem Imagem',
        description: 'Descrição sem imagem',
        materials: 'Materiais sem imagem',
        approximate_duration_minutes: 20,
        group_sizes: ['medium'],
        effort_level: 'low',
        locations: ['inside'],
        age_groups: ['leaders'],
        activity_type_id: activityType[0].id,
        image_url: null,
      });

      const response = await fetch(`/api/activities/${activity[0].id}`);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.image_url).toBeNull();
    });

    it.skip('handles database errors gracefully', async () => {
      // This test would require mocking the database to throw an error
      // For now, we'll test that the API doesn't crash with invalid data
      
      const response = await fetch('/api/activities/invalid-uuid-format');
      expect(response.status).toBe(404);
    });

    it.skip('returns proper error message for server errors', async () => {
      // This test would require more complex mocking of the database layer
      // For now, we'll test the basic error handling structure
      
      const response = await fetch('/api/activities/non-existent-id');
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(typeof data.error).toBe('string');
    });
  });
});
