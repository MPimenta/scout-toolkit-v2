import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { activityTypes } from '../schema/taxonomies';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Basic activity types
const activityTypeData = [
  {
    name: 'Jogo',
    description: 'Atividades lúdicas e divertidas',
  },
  {
    name: 'Quebra-Gelo',
    description: 'Atividades para quebrar o gelo e criar ambiente',
  },
  {
    name: 'Desafio',
    description: 'Atividades que testam habilidades e competências',
  },
  {
    name: 'Reflexão',
    description: 'Atividades de reflexão e pensamento crítico',
  },
  {
    name: 'Criatividade',
    description: 'Atividades que estimulam a criatividade',
  },
  {
    name: 'Cooperação',
    description: 'Atividades que promovem o trabalho em equipa',
  },
  {
    name: 'Liderança',
    description: 'Atividades que desenvolvem competências de liderança',
  },
  {
    name: 'Aventura',
    description: 'Atividades de aventura e exploração',
  },
  {
    name: 'Serviço',
    description: 'Atividades de serviço à comunidade',
  },
  {
    name: 'Técnica',
    description: 'Atividades que ensinam técnicas e habilidades',
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
