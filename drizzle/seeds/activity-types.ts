import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { activityTypes } from '../schema/taxonomies';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Basic activity types
const activityTypeData = [
  {
    name: { pt: 'Jogo', en: 'Game' },
    description: { pt: 'Atividades lúdicas e divertidas', en: 'Fun and entertaining activities' },
  },
  {
    name: { pt: 'Quebra-Gelo', en: 'Icebreaker' },
    description: { pt: 'Atividades para quebrar o gelo e criar ambiente', en: 'Activities to break the ice and create atmosphere' },
  },
  {
    name: { pt: 'Desafio', en: 'Challenge' },
    description: { pt: 'Atividades que testam habilidades e competências', en: 'Activities that test skills and competencies' },
  },
  {
    name: { pt: 'Reflexão', en: 'Reflection' },
    description: { pt: 'Atividades de reflexão e pensamento crítico', en: 'Activities for reflection and critical thinking' },
  },
  {
    name: { pt: 'Criatividade', en: 'Creativity' },
    description: { pt: 'Atividades que estimulam a criatividade', en: 'Activities that stimulate creativity' },
  },
  {
    name: { pt: 'Cooperação', en: 'Cooperation' },
    description: { pt: 'Atividades que promovem o trabalho em equipa', en: 'Activities that promote teamwork' },
  },
  {
    name: { pt: 'Liderança', en: 'Leadership' },
    description: { pt: 'Atividades que desenvolvem competências de liderança', en: 'Activities that develop leadership skills' },
  },
  {
    name: { pt: 'Aventura', en: 'Adventure' },
    description: { pt: 'Atividades de aventura e exploração', en: 'Adventure and exploration activities' },
  },
  {
    name: { pt: 'Serviço', en: 'Service' },
    description: { pt: 'Atividades de serviço à comunidade', en: 'Community service activities' },
  },
  {
    name: { pt: 'Técnica', en: 'Technical' },
    description: { pt: 'Atividades que ensinam técnicas e habilidades', en: 'Activities that teach techniques and skills' },
  },
];

export async function seedActivityTypes() {
  console.log('🎯 Seeding activity types...');
  
  try {
    for (const activityType of activityTypeData) {
      await db.insert(activityTypes).values({
        name: activityType.name,
        description: activityType.description,
      }).onConflictDoNothing();
    }
    
    console.log('✅ Activity types seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding activity types:', error);
    throw error;
  }
}
