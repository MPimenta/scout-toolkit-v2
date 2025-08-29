import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { educationalAreas, educationalGoals } from '../schema/taxonomies';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Educational areas and their goals
const educationalAreasData = [
  {
    area: {
      name: { pt: 'Competências Sociais', en: 'Social Skills' },
      description: { pt: 'Desenvolvimento de competências de comunicação e relacionamento', en: 'Development of communication and relationship skills' },
      icon: 'users',
      code: 'SOCIAL',
    },
    goals: [
      {
        title: { pt: 'Comunicação Eficaz', en: 'Effective Communication' },
        description: { pt: 'Desenvolver competências de comunicação verbal e não-verbal', en: 'Develop verbal and non-verbal communication skills' },
        code: 'SOCIAL_COMM',
      },
      {
        title: { pt: 'Trabalho em Equipa', en: 'Teamwork' },
        description: { pt: 'Aprender a trabalhar colaborativamente em grupo', en: 'Learn to work collaboratively in groups' },
        code: 'SOCIAL_TEAM',
      },
      {
        title: { pt: 'Empatia', en: 'Empathy' },
        description: { pt: 'Desenvolver a capacidade de compreender os outros', en: 'Develop the ability to understand others' },
        code: 'SOCIAL_EMPATHY',
      },
    ],
  },
  {
    area: {
      name: { pt: 'Liderança', en: 'Leadership' },
      description: { pt: 'Desenvolvimento de competências de liderança e responsabilidade', en: 'Development of leadership and responsibility skills' },
      icon: 'flag',
      code: 'LEADERSHIP',
    },
    goals: [
      {
        title: { pt: 'Tomada de Decisão', en: 'Decision Making' },
        description: { pt: 'Desenvolver competências de análise e tomada de decisão', en: 'Develop analysis and decision-making skills' },
        code: 'LEADERSHIP_DECISION',
      },
      {
        title: { pt: 'Responsabilidade', en: 'Responsibility' },
        description: { pt: 'Assumir responsabilidades e compromissos', en: 'Take on responsibilities and commitments' },
        code: 'LEADERSHIP_RESPONSIBILITY',
      },
      {
        title: { pt: 'Motivação', en: 'Motivation' },
        description: { pt: 'Desenvolver competências de motivação e inspiração', en: 'Develop motivation and inspiration skills' },
        code: 'LEADERSHIP_MOTIVATION',
      },
    ],
  },
  {
    area: {
      name: { pt: 'Criatividade', en: 'Creativity' },
      description: { pt: 'Desenvolvimento da criatividade e pensamento inovador', en: 'Development of creativity and innovative thinking' },
      icon: 'lightbulb',
      code: 'CREATIVITY',
    },
    goals: [
      {
        title: { pt: 'Pensamento Criativo', en: 'Creative Thinking' },
        description: { pt: 'Desenvolver o pensamento criativo e inovador', en: 'Develop creative and innovative thinking' },
        code: 'CREATIVITY_THINKING',
      },
      {
        title: { pt: 'Expressão Artística', en: 'Artistic Expression' },
        description: { pt: 'Explorar diferentes formas de expressão artística', en: 'Explore different forms of artistic expression' },
        code: 'CREATIVITY_ART',
      },
      {
        title: { pt: 'Resolução de Problemas', en: 'Problem Solving' },
        description: { pt: 'Desenvolver competências de resolução criativa de problemas', en: 'Develop creative problem-solving skills' },
        code: 'CREATIVITY_PROBLEM',
      },
    ],
  },
  {
    area: {
      name: { pt: 'Cidadania', en: 'Citizenship' },
      description: { pt: 'Desenvolvimento da consciência cívica e responsabilidade social', en: 'Development of civic awareness and social responsibility' },
      icon: 'globe',
      code: 'CITIZENSHIP',
    },
    goals: [
      {
        title: { pt: 'Consciência Ambiental', en: 'Environmental Awareness' },
        description: { pt: 'Desenvolver consciência sobre questões ambientais', en: 'Develop awareness of environmental issues' },
        code: 'CITIZENSHIP_ENVIRONMENT',
      },
      {
        title: { pt: 'Participação Cívica', en: 'Civic Participation' },
        description: { pt: 'Promover a participação ativa na comunidade', en: 'Promote active participation in the community' },
        code: 'CITIZENSHIP_PARTICIPATION',
      },
      {
        title: { pt: 'Direitos e Deveres', en: 'Rights and Duties' },
        description: { pt: 'Compreender direitos e deveres como cidadão', en: 'Understand rights and duties as a citizen' },
        code: 'CITIZENSHIP_RIGHTS',
      },
    ],
  },
  {
    area: {
      name: { pt: 'Competências Técnicas', en: 'Technical Skills' },
      description: { pt: 'Desenvolvimento de competências técnicas e práticas', en: 'Development of technical and practical skills' },
      icon: 'wrench',
      code: 'TECHNICAL',
    },
    goals: [
      {
        title: { pt: 'Primeiros Socorros', en: 'First Aid' },
        description: { pt: 'Aprender técnicas básicas de primeiros socorros', en: 'Learn basic first aid techniques' },
        code: 'TECHNICAL_FIRST_AID',
      },
      {
        title: { pt: 'Nós e Amarrações', en: 'Knots and Lashings' },
        description: { pt: 'Aprender diferentes tipos de nós e amarrações', en: 'Learn different types of knots and lashings' },
        code: 'TECHNICAL_KNOTS',
      },
      {
        title: { pt: 'Orientação', en: 'Orienteering' },
        description: { pt: 'Desenvolver competências de orientação e navegação', en: 'Develop orienteering and navigation skills' },
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
