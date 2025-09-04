import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { educationalAreas, educationalGoals } from '../schema/taxonomies';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Educational areas and their goals
const educationalAreasData = [
  {
    area: {
      name: 'Competências Sociais',
      description: 'Desenvolvimento de competências de comunicação e relacionamento',
      icon: 'users',
      code: 'SOCIAL',
    },
    goals: [
      {
        title: 'Comunicação Eficaz',
        description: 'Desenvolver competências de comunicação verbal e não-verbal',
        code: 'SOCIAL_COMM',
      },
      {
        title: 'Trabalho em Equipa',
        description: 'Aprender a trabalhar colaborativamente em grupo',
        code: 'SOCIAL_TEAM',
      },
      {
        title: 'Empatia',
        description: 'Desenvolver a capacidade de compreender os outros',
        code: 'SOCIAL_EMPATHY',
      },
    ],
  },
  {
    area: {
      name: 'Liderança',
      description: 'Desenvolvimento de competências de liderança e responsabilidade',
      icon: 'flag',
      code: 'LEADERSHIP',
    },
    goals: [
      {
        title: 'Tomada de Decisão',
        description: 'Desenvolver competências de análise e tomada de decisão',
        code: 'LEADERSHIP_DECISION',
      },
      {
        title: 'Responsabilidade',
        description: 'Assumir responsabilidades e compromissos',
        code: 'LEADERSHIP_RESPONSIBILITY',
      },
      {
        title: 'Motivação',
        description: 'Desenvolver competências de motivação e inspiração',
        code: 'LEADERSHIP_MOTIVATION',
      },
    ],
  },
  {
    area: {
      name: 'Criatividade',
      description: 'Desenvolvimento da criatividade e pensamento inovador',
      icon: 'lightbulb',
      code: 'CREATIVITY',
    },
    goals: [
      {
        title: 'Pensamento Criativo',
        description: 'Desenvolver o pensamento criativo e inovador',
        code: 'CREATIVITY_THINKING',
      },
      {
        title: 'Expressão Artística',
        description: 'Explorar diferentes formas de expressão artística',
        code: 'CREATIVITY_ART',
      },
      {
        title: 'Resolução de Problemas',
        description: 'Desenvolver competências de resolução criativa de problemas',
        code: 'CREATIVITY_PROBLEM',
      },
    ],
  },
  {
    area: {
      name: 'Cidadania',
      description: 'Desenvolvimento da consciência cívica e responsabilidade social',
      icon: 'globe',
      code: 'CITIZENSHIP',
    },
    goals: [
      {
        title: 'Consciência Ambiental',
        description: 'Desenvolver consciência sobre questões ambientais',
        code: 'CITIZENSHIP_ENVIRONMENT',
      },
      {
        title: 'Participação Cívica',
        description: 'Promover a participação ativa na comunidade',
        code: 'CITIZENSHIP_PARTICIPATION',
      },
      {
        title: 'Direitos e Deveres',
        description: 'Compreender direitos e deveres como cidadão',
        code: 'CITIZENSHIP_RIGHTS',
      },
    ],
  },
  {
    area: {
      name: 'Competências Técnicas',
      description: 'Desenvolvimento de competências técnicas e práticas',
      icon: 'wrench',
      code: 'TECHNICAL',
    },
    goals: [
      {
        title: 'Primeiros Socorros',
        description: 'Aprender técnicas básicas de primeiros socorros',
        code: 'TECHNICAL_FIRST_AID',
      },
      {
        title: 'Nós e Amarrações',
        description: 'Aprender diferentes tipos de nós e amarrações',
        code: 'TECHNICAL_KNOTS',
      },
      {
        title: 'Orientação',
        description: 'Desenvolver competências de orientação e navegação',
        code: 'TECHNICAL_ORIENTEERING',
      },
    ],
  },
];

export async function seedEducationalAreas() {
  console.log('📚 Seeding educational areas...');
  
  try {
    for (const areaData of educationalAreasData) {
      // Insert educational area
      const [area] = await db.insert(educationalAreas).values({
        name: areaData.area.name,
        description: areaData.area.description,
        icon: areaData.area.icon,
        code: areaData.area.code,
      }).onConflictDoNothing().returning();

      if (area) {
        // Insert educational goals for this area
        for (const goal of areaData.goals) {
          await db.insert(educationalGoals).values({
            area_id: area.id,
            title: goal.title,
            description: goal.description,
            code: goal.code,
          }).onConflictDoNothing();
        }
      }
    }
    
    console.log('✅ Educational areas seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding educational areas:', error);
    throw error;
  }
}
