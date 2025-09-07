import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { activityTypes, educationalGoals, sdgs } from '../schema/taxonomies';
import { activities, activityEducationalGoals, activitySdgs } from '../schema/activities';

// Load environment variables
dotenv.config({ path: '.env.local' });
import { eq } from 'drizzle-orm';

// Demo activities for testing
const demoActivitiesData = [
  {
    name: 'Jogo do Nome e Gesto',
    description: 'Um jogo divertido onde cada pessoa diz o seu nome acompanhado de um gesto. Os outros repetem o nome e o gesto de todos os que já se apresentaram antes de se apresentarem a si próprios.',
    materials: 'Nenhum material necessário',
    approximate_duration_minutes: 15,
    group_size: 'medium' as const,
    effort_level: 'low' as const,
    location: 'inside' as const,
    age_group: 'cub_scouts' as const,
    activity_type_name: 'Jogo',
    educational_goal_codes: ['SOCIAL_COMM', 'SOCIAL_TEAM'],
    sdg_numbers: [4, 5],
  },
  {
    name: 'Caça ao Tesouro',
    description: 'Uma caça ao tesouro com pistas que levam os participantes a descobrir um tesouro escondido. As pistas podem incluir charadas, códigos ou orientações.',
    materials: 'Pistas, tesouro (doces ou pequenos prémios), papel e lápis',
    approximate_duration_minutes: 45,
    group_size: 'large' as const,
    effort_level: 'medium' as const,
    location: 'outside' as const,
    age_group: 'scouts' as const,
    activity_type_name: 'Jogo',
    educational_goal_codes: ['TECHNICAL_ORIENTEERING', 'SOCIAL_TEAM', 'CREATIVITY_PROBLEM'],
    sdg_numbers: [4, 15],
  },
  {
    name: 'Reflexão do Dia',
    description: 'Uma atividade de reflexão onde os participantes partilham os momentos mais importantes do dia, o que aprenderam e como se sentiram.',
    materials: 'Vela (opcional para criar ambiente), perguntas de reflexão',
    approximate_duration_minutes: 20,
    group_size: 'small' as const,
    effort_level: 'low' as const,
    location: 'inside' as const,
    age_group: 'adventurers' as const,
    activity_type_name: 'Reflexão',
    educational_goal_codes: ['SOCIAL_EMPATHY', 'LEADERSHIP_DECISION'],
    sdg_numbers: [3, 4],
  },
  {
    name: 'Construção de Abrigo',
    description: 'Os participantes constroem um abrigo usando materiais naturais encontrados na natureza. Aprende-se sobre técnicas de construção e trabalho em equipa.',
    materials: 'Cordas, ramos, folhas, ferramentas básicas (se disponíveis)',
    approximate_duration_minutes: 90,
    group_size: 'medium' as const,
    effort_level: 'high' as const,
    location: 'outside' as const,
    age_group: 'rovers' as const,
    activity_type_name: 'Técnica',
    educational_goal_codes: ['TECHNICAL_KNOTS', 'SOCIAL_TEAM', 'LEADERSHIP_RESPONSIBILITY'],
    sdg_numbers: [4, 15],
  },
  {
    name: 'Limpeza da Comunidade',
    description: 'Uma atividade de serviço onde os participantes limpam uma área da comunidade, recolhendo lixo e promovendo a consciência ambiental.',
    materials: 'Sacos de lixo, luvas, pinças (opcional)',
    approximate_duration_minutes: 60,
    group_size: 'large' as const,
    effort_level: 'medium' as const,
    location: 'outside' as const,
    age_group: 'scouts' as const,
    activity_type_name: 'Serviço',
    educational_goal_codes: ['CITIZENSHIP_ENVIRONMENT', 'CITIZENSHIP_PARTICIPATION', 'SOCIAL_TEAM'],
    sdg_numbers: [11, 12, 15],
  },
];

export async function seedDemoActivities() {
  console.log('🎮 Seeding demo activities...');
  
  try {
    for (const activityData of demoActivitiesData) {
      // Get activity type ID
      const [activityType] = await db
        .select()
        .from(activityTypes)
        .where(eq(activityTypes.name, activityData.activity_type_name))
        .limit(1);

      if (!activityType) {
        console.warn(`⚠️ Activity type not found: ${activityData.activity_type_name}`);
        continue;
      }

      // Insert activity
      const [activity] = await db.insert(activities).values({
        name: activityData.name,
        description: activityData.description,
        materials: activityData.materials,
        approximate_duration_minutes: activityData.approximate_duration_minutes,
        group_size: activityData.group_size,
        effort_level: activityData.effort_level,
        location: activityData.location,
        age_group: activityData.age_group,
        activity_type_id: activityType.id,
        is_approved: true,
      }).onConflictDoNothing().returning();

      if (activity) {
        // Link educational goals
        for (const goalCode of activityData.educational_goal_codes) {
          const [goal] = await db
            .select()
            .from(educationalGoals)
            .where(eq(educationalGoals.code, goalCode))
            .limit(1);

          if (goal) {
            await db.insert(activityEducationalGoals).values({
              activity_id: activity.id,
              goal_id: goal.id,
            }).onConflictDoNothing();
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
