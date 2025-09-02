import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { activities, activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs, educationalAreas } from '../../../drizzle/schema';

describe('Activity Detail API Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe('GET /api/activities/[id]', () => {
    // TODO: These tests need to be rewritten to test the actual API logic
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
        name: { pt: 'Tipo de Atividade', en: 'Activity Type' },
        description: { pt: 'Descrição do tipo', en: 'Type description' },
      }).returning();

      const educationalArea = await db.insert(educationalAreas).values({
        name: { pt: 'Área Educativa', en: 'Educational Area' },
        description: { pt: 'Descrição da área', en: 'Area description' },
        icon: '🎯',
        code: 'AREA_1',
      }).returning();

      const educationalGoal = await db.insert(educationalGoals).values({
        area_id: educationalArea[0].id,
        title: { pt: 'Objetivo Educativo', en: 'Educational Goal' },
        description: { pt: 'Descrição do objetivo', en: 'Goal description' },
        code: 'GOAL_1',
      }).returning();

      const sdg = await db.insert(sdgs).values({
        number: 1,
        name: { pt: 'Erradicar a Pobreza', en: 'No Poverty' },
        description: { pt: 'Acabar com a pobreza', en: 'End poverty' },
        icon_url: 'https://example.com/sdg-1.png',
      }).returning();

      const activity = await db.insert(activities).values({
        name: { pt: 'Atividade de Teste', en: 'Test Activity' },
        description: { pt: 'Descrição da atividade', en: 'Activity description' },
        materials: { pt: 'Materiais necessários', en: 'Required materials' },
        approximate_duration_minutes: 60,
        group_size: 'medium',
        effort_level: 'medium',
        location: 'outside',
        age_group: 'scouts',
        image_url: 'https://example.com/test.jpg',
        activity_type_id: activityType[0].id,
      }).returning();

      // Create relationships
      await db.insert(activityEducationalGoals).values({
        activity_id: activity[0].id,
        goal_id: educationalGoal[0].id,
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
      expect(data.name.pt).toBe('Atividade de Teste');
      expect(data.name.en).toBe('Test Activity');
      expect(data.description.pt).toBe('Descrição da atividade');
      expect(data.materials.pt).toBe('Materiais necessários');
      expect(data.approximate_duration_minutes).toBe(60);
      expect(data.group_size).toBe('medium');
      expect(data.effort_level).toBe('medium');
      expect(data.location).toBe('outside');
      expect(data.age_group).toBe('scouts');
      expect(data.image_url).toBe('https://example.com/test.jpg');

      // Check activity type
      expect(data.activity_type.id).toBe(activityType[0].id);
      expect(data.activity_type.name.pt).toBe('Tipo de Atividade');

      // Check educational goals
      expect(data.educational_goals).toHaveLength(1);
      expect(data.educational_goals[0].id).toBe(educationalGoal[0].id);
      expect(data.educational_goals[0].title.pt).toBe('Objetivo Educativo');
      expect(data.educational_goals[0].area.id).toBe(educationalArea[0].id);
      expect(data.educational_goals[0].area.name.pt).toBe('Área Educativa');
      expect(data.educational_goals[0].area.icon).toBe('🎯');
      expect(data.educational_goals[0].area.code).toBe('AREA_1');

      // Check SDGs
      expect(data.sdgs).toHaveLength(1);
      expect(data.sdgs[0].id).toBe(sdg[0].id);
      expect(data.sdgs[0].number).toBe(1);
      expect(data.sdgs[0].name.pt).toBe('Erradicar a Pobreza');
      expect(data.sdgs[0].icon_url).toBe('https://example.com/sdg-1.png');
    });

    it.skip('handles activities without educational goals gracefully', async () => {
      // Create test data without educational goals
      const activityType = await db.insert(activityTypes).values({
        name: { pt: 'Tipo de Atividade', en: 'Activity Type' },
      }).returning();

      const activity = await db.insert(activities).values({
        name: { pt: 'Atividade Simples', en: 'Simple Activity' },
        description: { pt: 'Descrição simples', en: 'Simple description' },
        materials: { pt: 'Materiais básicos', en: 'Basic materials' },
        approximate_duration_minutes: 30,
        group_size: 'small',
        effort_level: 'low',
        location: 'inside',
        age_group: 'cub_scouts',
        activity_type_id: activityType[0].id,
      }).returning();

      const response = await fetch(`/api/activities/${activity[0].id}`);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.educational_goals).toHaveLength(0);
      expect(data.sdgs).toHaveLength(0);
    });

    it.skip('handles activities without SDGs gracefully', async () => {
      // Create test data without SDGs
      const activityType = await db.insert(activityTypes).values({
        name: { pt: 'Tipo de Atividade', en: 'Activity Type' },
      }).returning();

      const activity = await db.insert(activities).values({
        name: { pt: 'Atividade Sem ODS', en: 'Activity Without SDGs' },
        description: { pt: 'Descrição sem ODS', en: 'Description without SDGs' },
        materials: { pt: 'Materiais sem ODS', en: 'Materials without SDGs' },
        approximate_duration_minutes: 45,
        group_size: 'large',
        effort_level: 'high',
        location: 'outside',
        age_group: 'rovers',
        activity_type_id: activityType[0].id,
      }).returning();

      const response = await fetch(`/api/activities/${activity[0].id}`);
      expect(response.status).toBe(200);

      const data = await response.json();

      expect(data.sdgs).toHaveLength(0);
    });

    it.skip('handles activities without image gracefully', async () => {
      // Create test data without image
      const activityType = await db.insert(activityTypes).values({
        name: { pt: 'Tipo de Atividade', en: 'Activity Type' },
      }).returning();

      const activity = await db.insert(activities).values({
        name: { pt: 'Atividade Sem Imagem', en: 'Activity Without Image' },
        description: { pt: 'Descrição sem imagem', en: 'Description without image' },
        materials: { pt: 'Materiais sem imagem', en: 'Materials without image' },
        approximate_duration_minutes: 20,
        group_size: 'medium',
        effort_level: 'low',
        location: 'inside',
        age_group: 'leaders',
        activity_type_id: activityType[0].id,
        image_url: null,
      }).returning();

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
