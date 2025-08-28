import { db } from '@/lib/db';
import { activityTypes, educationalGoals, sdgs } from '../schema/taxonomies';
import { activities, activityEducationalGoals, activitySdgs } from '../schema/activities';
import { sql, eq } from 'drizzle-orm';

// Demo activities for testing
const demoActivitiesData = [
  {
    name: { pt: 'Jogo do Nome e Gesto', en: 'Name and Gesture Game' },
    description: { 
      pt: 'Um jogo divertido onde cada pessoa diz o seu nome acompanhado de um gesto. Os outros repetem o nome e o gesto de todos os que já se apresentaram antes de se apresentarem a si próprios.',
      en: 'A fun game where each person says their name accompanied by a gesture. Others repeat the name and gesture of everyone who has already introduced themselves before introducing themselves.'
    },
    materials: { 
      pt: 'Nenhum material necessário',
      en: 'No materials needed'
    },
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
    name: { pt: 'Caça ao Tesouro', en: 'Treasure Hunt' },
    description: { 
      pt: 'Uma caça ao tesouro com pistas que levam os participantes a descobrir um tesouro escondido. As pistas podem incluir charadas, códigos ou orientações.',
      en: 'A treasure hunt with clues that lead participants to discover a hidden treasure. Clues can include riddles, codes, or directions.'
    },
    materials: { 
      pt: 'Pistas, tesouro (doces ou pequenos prémios), papel e lápis',
      en: 'Clues, treasure (candies or small prizes), paper and pencil'
    },
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
    name: { pt: 'Reflexão do Dia', en: 'Day Reflection' },
    description: { 
      pt: 'Uma atividade de reflexão onde os participantes partilham os momentos mais importantes do dia, o que aprenderam e como se sentiram.',
      en: 'A reflection activity where participants share the most important moments of the day, what they learned and how they felt.'
    },
    materials: { 
      pt: 'Vela (opcional para criar ambiente), perguntas de reflexão',
      en: 'Candle (optional to create atmosphere), reflection questions'
    },
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
    name: { pt: 'Construção de Abrigo', en: 'Shelter Building' },
    description: { 
      pt: 'Os participantes constroem um abrigo usando materiais naturais encontrados na natureza. Aprende-se sobre técnicas de construção e trabalho em equipa.',
      en: 'Participants build a shelter using natural materials found in nature. Learn about construction techniques and teamwork.'
    },
    materials: { 
      pt: 'Cordas, ramos, folhas, ferramentas básicas (se disponíveis)',
      en: 'Ropes, branches, leaves, basic tools (if available)'
    },
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
    name: { pt: 'Limpeza da Comunidade', en: 'Community Cleanup' },
    description: { 
      pt: 'Uma atividade de serviço onde os participantes limpam uma área da comunidade, recolhendo lixo e promovendo a consciência ambiental.',
      en: 'A service activity where participants clean a community area, collecting trash and promoting environmental awareness.'
    },
    materials: { 
      pt: 'Sacos de lixo, luvas, pinças (opcional)',
      en: 'Garbage bags, gloves, tongs (optional)'
    },
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
        .where(sql`${activityTypes.name}->>'pt' = ${activityData.activity_type_name}`)
        .limit(1);

      if (!activityType) {
        console.warn(`⚠️ Activity type not found: ${activityData.activity_type_name}`);
        continue;
      }

      // Insert activity
      const [activity] = await db.insert(activities).values({
        name: JSON.stringify(activityData.name),
        description: JSON.stringify(activityData.description),
        materials: JSON.stringify(activityData.materials),
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
