import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { activityFocuses, activityFormats, educationalGoalAgeGroups, educationalGoals, sdgs } from '../schema/taxonomies';
import {
  activities,
  activityEducationalGoals,
  activitySdgs,
  activityGroupSizes,
  activityLocations,
  activityAgeGroups,
} from '../schema/activities';

// Load environment variables
dotenv.config({ path: '.env.local' });
import { eq } from 'drizzle-orm';

// Demo activities for testing. Objectives are Matriz codes and always belong to one of the
// activity's age groups; several activities are multi-valued (group sizes, age groups, objectives).
const demoActivitiesData = [
  {
    name: 'Jogo do Nome e Gesto',
    description: 'Um jogo divertido onde cada pessoa diz o seu nome acompanhado de um gesto. Os outros repetem o nome e o gesto de todos os que já se apresentaram antes de se apresentarem a si próprios.',
    materials: 'Nenhum material necessário',
    approximate_duration_minutes: 15,
    group_sizes: ['medium' as const, 'large' as const],
    effort_level: 'low' as const,
    locations: ['inside' as const, 'outside' as const],
    age_groups: ['cub_scouts' as const, 'scouts' as const],
    format_code: 'quebra-gelo',
    focus_code: 'comunicacao',
    educational_goal_codes: ['1S.1', '1S.2', '1A.2'],
    sdg_numbers: [4, 5],
  },
  {
    name: 'Caça ao Tesouro',
    description: 'Uma caça ao tesouro com pistas que levam os participantes a descobrir um tesouro escondido. As pistas podem incluir charadas, códigos ou orientações.',
    materials: 'Pistas, tesouro (doces ou pequenos prémios), papel e lápis',
    approximate_duration_minutes: 45,
    group_sizes: ['large' as const, 'medium' as const],
    effort_level: 'medium' as const,
    locations: ['outside' as const],
    age_groups: ['scouts' as const, 'adventurers' as const],
    format_code: 'aventura-percurso',
    focus_code: 'cooperacao',
    educational_goal_codes: ['5I.2', '5I.3-4', '4S.2.2-3'],
    sdg_numbers: [4, 15],
  },
  {
    name: 'Reflexão do Dia',
    description: 'Uma atividade de reflexão onde os participantes partilham os momentos mais importantes do dia, o que aprenderam e como se sentiram.',
    materials: 'Vela (opcional para criar ambiente), perguntas de reflexão',
    approximate_duration_minutes: 20,
    group_sizes: ['small' as const],
    effort_level: 'low' as const,
    locations: ['inside' as const],
    age_groups: ['adventurers' as const, 'rovers' as const],
    format_code: 'reflexao-debriefing',
    focus_code: 'valores-reflexao',
    educational_goal_codes: ['7E.3', '7E.4', '3A.3-4'],
    sdg_numbers: [3, 4],
  },
  {
    name: 'Construção de Abrigo',
    description: 'Os participantes constroem um abrigo usando materiais naturais encontrados na natureza. Aprende-se sobre técnicas de construção e trabalho em equipa.',
    materials: 'Cordas, ramos, folhas, ferramentas básicas (se disponíveis)',
    approximate_duration_minutes: 90,
    group_sizes: ['medium' as const, 'large' as const],
    effort_level: 'high' as const,
    locations: ['outside' as const],
    age_groups: ['adventurers' as const, 'rovers' as const],
    format_code: 'tecnica-oficina',
    focus_code: 'competencias-tecnicas',
    educational_goal_codes: ['3F.3-4', '4F.4.3-4', '4S.1.3-4'],
    sdg_numbers: [4, 15],
  },
  {
    name: 'Limpeza da Comunidade',
    description: 'Uma atividade de serviço onde os participantes limpam uma área da comunidade, recolhendo lixo e promovendo a consciência ambiental.',
    materials: 'Sacos de lixo, luvas, pinças (opcional)',
    approximate_duration_minutes: 60,
    group_sizes: ['large' as const],
    effort_level: 'medium' as const,
    locations: ['outside' as const],
    age_groups: ['scouts' as const],
    format_code: 'desafio-iniciativa',
    focus_code: 'cooperacao',
    educational_goal_codes: ['6S.2', '7S.1.2', '5S.2'],
    sdg_numbers: [11, 12, 15],
  },
];

export async function seedDemoActivities() {
  console.log('🎮 Seeding demo activities...');
  
  try {
    for (const activityData of demoActivitiesData) {
      // The format and the focus come from the reference data (loaded before the demo activities)
      const [format] = await db.select().from(activityFormats).where(eq(activityFormats.code, activityData.format_code)).limit(1);
      const [focus] = await db.select().from(activityFocuses).where(eq(activityFocuses.code, activityData.focus_code)).limit(1);
      if (!format || !focus) {
        console.warn(`⚠️ Format or focus not found: ${activityData.format_code} / ${activityData.focus_code}`);
        continue;
      }

      // Insert activity
      const [activity] = await db.insert(activities).values({
        name: activityData.name,
        description: activityData.description,
        materials: activityData.materials,
        approximate_duration_minutes: activityData.approximate_duration_minutes,
        effort_level: activityData.effort_level,
        format_id: format.id,
        focus_id: focus.id,
        is_approved: true,
      }).onConflictDoNothing().returning();

      if (activity) {
        await db.insert(activityGroupSizes).values(
          activityData.group_sizes.map((group_size) => ({ activity_id: activity.id, group_size }))
        );
        await db.insert(activityLocations).values(
          activityData.locations.map((location) => ({ activity_id: activity.id, location }))
        );
        await db.insert(activityAgeGroups).values(
          activityData.age_groups.map((age_group) => ({ activity_id: activity.id, age_group }))
        );

        // Link educational goals
        for (const goalCode of activityData.educational_goal_codes) {
          const [goal] = await db
            .select()
            .from(educationalGoals)
            .where(eq(educationalGoals.code, goalCode))
            .limit(1);

          if (goal) {
            // One row per division of the activity the objective belongs to.
            const own = await db
              .select({ age_group: educationalGoalAgeGroups.age_group })
              .from(educationalGoalAgeGroups)
              .where(eq(educationalGoalAgeGroups.goal_id, goal.id));
            const shared = activityData.age_groups.filter((group) => own.some((row) => row.age_group === group));
            if (shared.length > 0) {
              await db.insert(activityEducationalGoals).values(
                shared.map((age_group) => ({ activity_id: activity.id, goal_id: goal.id, age_group }))
              ).onConflictDoNothing();
            }
          }
        }

        // Link SDGs
        for (const sdgNumber of activityData.sdg_numbers) {
          const [sdg] = await db
            .select()
            .from(sdgs)
            .where(eq(sdgs.number, sdgNumber))
            .limit(1);

          if (sdg) {
            await db.insert(activitySdgs).values({
              activity_id: activity.id,
              sdg_id: sdg.id,
            }).onConflictDoNothing();
          }
        }
      }
    }
    
    console.log('✅ Demo activities seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding demo activities:', error);
    throw error;
  }
}
