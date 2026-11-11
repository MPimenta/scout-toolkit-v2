import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/server';
import { loadDescriptionProgram } from '@/lib/orgo/description-data';
import { buildOrgoDescription } from '@/lib/orgo/description';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import {
  activities,
  activityChallenges,
  activityEducationalGoals,
  challengeGoals,
  challengeTypes,
  challenges,
  educationalAreas,
  educationalGoals,
  programEntries,
  programs,
  user,
} from '../../../drizzle/schema';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440701';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440702';

async function activity(name: string, minutes: number): Promise<string> {
  const [row] = await db
    .insert(activities)
    .values({ name, description: 'd', materials: 'm', approximate_duration_minutes: minutes, effort_level: 'low' })
    .returning({ id: activities.id });
  return row!.id;
}

describe('loadDescriptionProgram (DB)', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await db.insert(user).values({ id: OWNER_ID, email: 'dono-desc@escoteiros.pt', name: 'Dona', role: 'user' });
    await db.insert(programs).values({ id: PROGRAM_ID, name: 'Reunião', date: '2026-11-14', start_time: '09:00', user_id: OWNER_ID });
  });

  it('lists the desafios of the program activities with only the behaviours that belong to them', async () => {
    const [area] = await db.insert(educationalAreas).values({ name: 'Área', icon: 'users', code: 'AR' }).returning({ id: educationalAreas.id });
    const [goalA, goalB] = await db
      .insert(educationalGoals)
      .values([
        { area_id: area!.id, title: 'Objetivo A', code: '4E.1.1' },
        { area_id: area!.id, title: 'Objetivo B', code: '4E.2.1' },
      ])
      .returning({ id: educationalGoals.id });
    const [type] = await db.insert(challengeTypes).values({ code: 'CC', name: 'Tipo' }).returning({ id: challengeTypes.id });
    const [cc, other] = await db
      .insert(challenges)
      .values([
        { code: 'CC-A', type_id: type!.id, age_group: 'cub_scouts', title: 'Título completo', short_title: 'Curto', integration_age_groups: ['cub_scouts'] },
        { code: 'ZZ-Z', type_id: type!.id, age_group: 'scouts', title: 'Outro desafio', integration_age_groups: [] },
      ])
      .returning({ id: challenges.id });
    // CC-A develops objective A only; ZZ-Z develops objective B.
    await db.insert(challengeGoals).values([
      { challenge_id: cc!.id, goal_id: goalA!.id },
      { challenge_id: other!.id, goal_id: goalB!.id },
    ]);

    const jogo = await activity('Jogo de apresentação', 30);
    const roda = await activity('Roda final', 20);
    const semDesafio = await activity('Sem desafio', 10);
    // Only "Jogo" and "Roda" are linked to CC-A; ZZ-Z is linked to nothing in this program.
    await db.insert(activityChallenges).values([
      { activity_id: jogo, challenge_id: cc!.id },
      { activity_id: roda, challenge_id: cc!.id },
    ]);
    await db.insert(activityEducationalGoals).values([
      { activity_id: jogo, goal_id: goalA!.id, age_group: 'cub_scouts', observable_behaviour: 'Respeita as regras' },
      // wrong division for CC-A: must not appear
      { activity_id: jogo, goal_id: goalA!.id, age_group: 'scouts', observable_behaviour: 'Comportamento de outra divisão' },
      // objective that CC-A does not develop: must not appear
      { activity_id: jogo, goal_id: goalB!.id, age_group: 'cub_scouts', observable_behaviour: 'Objetivo que não é do CC-A' },
      // same behaviour from a second activity: listed once
      { activity_id: roda, goal_id: goalA!.id, age_group: 'cub_scouts', observable_behaviour: 'Respeita as regras' },
      // no behaviour text: nothing to list
      { activity_id: semDesafio, goal_id: goalA!.id, age_group: 'cub_scouts', observable_behaviour: null },
    ]);

    await db.insert(programEntries).values([
      { program_id: PROGRAM_ID, position: 0, start_time: '09:00', end_time: '09:30', entry_type: 'activity', activity_id: jogo },
      { program_id: PROGRAM_ID, position: 1, start_time: '09:30', end_time: '09:45', entry_type: 'custom', custom_title: 'Pausa <b>', custom_duration_minutes: 15 },
      { program_id: PROGRAM_ID, position: 2, start_time: '09:45', end_time: '10:05', entry_type: 'activity', activity_id: roda },
      { program_id: PROGRAM_ID, position: 3, start_time: '10:05', end_time: '10:15', entry_type: 'activity', activity_id: semDesafio },
    ]);

    const result = await loadDescriptionProgram({ id: PROGRAM_ID, name: 'Reunião', start_time: '09:00' });

    expect(result.blocks.map((b) => [b.start, b.end, b.durationMinutes, b.title])).toEqual([
      ['09:00', '09:30', 30, 'Jogo de apresentação'],
      ['09:30', '09:45', 15, 'Pausa <b>'],
      ['09:45', '10:05', 20, 'Roda final'],
      ['10:05', '10:15', 10, 'Sem desafio'],
    ]);
    expect(result.challenges).toEqual([
      {
        code: 'CC-A',
        shortTitle: 'Curto',
        ageGroup: 'cub_scouts',
        mandatory: true,
        blocks: ['Jogo de apresentação', 'Roda final'],
        behaviours: ['Respeita as regras'],
      },
    ]);

    // The built text escapes the custom title and carries the desafio.
    const html = buildOrgoDescription(result);
    expect(html).toContain('Pausa &lt;b&gt;');
    expect(html).toContain('<b>CC-A</b> · Curto (Lobitos)');
    expect(html).toContain('Obrigatório para a integração (Lobitos)');
  });

  it('has no desafios for a program whose activities are not linked to any', async () => {
    const solto = await activity('Atividade solta', 30);
    await db.insert(programEntries).values({ program_id: PROGRAM_ID, position: 0, start_time: '09:00', end_time: '09:30', entry_type: 'activity', activity_id: solto });
    const result = await loadDescriptionProgram({ id: PROGRAM_ID, name: 'Reunião', start_time: '09:00' });
    expect(result.blocks).toHaveLength(1);
    expect(result.challenges).toEqual([]);
  });

  it('returns an empty program for a program without blocks', async () => {
    const result = await loadDescriptionProgram({ id: PROGRAM_ID, name: 'Reunião', start_time: '09:00' });
    expect(result).toEqual({ name: 'Reunião', blocks: [], challenges: [] });
  });
});
