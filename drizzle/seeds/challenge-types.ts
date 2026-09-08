import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { challengeTypes, challenges } from '../schema/taxonomies';

dotenv.config({ path: '.env.local' });

export const CHALLENGE_TYPE_NAMES = [
  'Estilo de Vida Ativo e Saudável',
  'Vida ao Ar Livre',
  'Comunidade e Cidadania',
  'Valores e Atitudes',
  'Vivência Escotista',
  'Técnicas Úteis',
  'Criatividade',
] as const;

export const SEEDED_CHALLENGES: Array<{
  name: string;
  type: (typeof CHALLENGE_TYPE_NAMES)[number];
  description: string;
}> = [
  {
    name: 'Completar 5 nós',
    type: 'Técnicas Úteis',
    description:
      'Lista de 10 nós (simples, oito, escota, volta do fiel, catau, pescador, cirurgião, aselha, lais de guia, nó de correr). Basta completar 5.',
  },
  {
    name: 'Montar um abrigo simples',
    type: 'Vida ao Ar Livre',
    description:
      'Construir um abrigo com materiais naturais (ramos, folhas, corda). Não é preciso um abrigo para a noite inteira; uma estrutura que proteja do vento e da chuva leve chega.',
  },
  {
    name: 'Seguir um percurso com pistas',
    type: 'Vida ao Ar Livre',
    description: 'Completar um percurso de orientação com pelo menos 5 pistas. As pistas podem ser charadas, códigos ou rumos.',
  },
  {
    name: 'Resolver um código ou charada em equipa',
    type: 'Criatividade',
    description: 'Decifrar pelo menos 3 pistas em colaboração. Não é preciso resolver todas as pistas sozinho.',
  },
  {
    name: 'Partilhar uma reflexão do dia',
    type: 'Valores e Atitudes',
    description: 'Partilhar um momento importante, uma aprendizagem e um sentimento. Três frases chegam.',
  },
  {
    name: 'Escutar o outro sem interromper',
    type: 'Vivência Escotista',
    description: 'Durante o círculo, escutar cada partilha até ao fim. O desafio é a escuta, não o discurso.',
  },
  {
    name: 'Recolher lixo numa ação de serviço',
    type: 'Comunidade e Cidadania',
    description: 'Participar numa limpeza comunitária e encher pelo menos um saco. O objetivo é o serviço, não a quantidade.',
  },
  {
    name: 'Cuidar do espaço comum',
    type: 'Comunidade e Cidadania',
    description: 'Deixar o local melhor do que foi encontrado (lixo, reciclagem, respeito pela natureza). Três gestos concretos chegam.',
  },
  {
    name: 'Apresentar-se com um gesto original',
    type: 'Criatividade',
    description: 'Dizer o nome com um gesto que o grupo consiga repetir. Não é preciso um gesto complexo.',
  },
  {
    name: 'Jogar pelo menos 15 minutos em movimento',
    type: 'Estilo de Vida Ativo e Saudável',
    description: 'Participar num jogo ativo durante pelo menos 15 minutos. O desafio é o movimento, não a competição.',
  },
];

async function upsertType(name: string) {
  await db.insert(challengeTypes).values({ name }).onConflictDoNothing();
  const [row] = await db.select().from(challengeTypes).where(eq(challengeTypes.name, name)).limit(1);
  return row;
}

async function upsertChallenge(name: string, description: string, typeId: string) {
  await db.insert(challenges).values({ name, description, type_id: typeId }).onConflictDoNothing();
  const [row] = await db.select().from(challenges).where(eq(challenges.name, name)).limit(1);
  return row;
}

export async function seedChallengeTypes() {
  console.log('🏁 Seeding challenge types and challenges...');

  try {
    const typesByName = new Map<string, { id: string }>();
    for (const name of CHALLENGE_TYPE_NAMES) {
      const row = await upsertType(name);
      if (!row) throw new Error(`Failed to seed challenge type: ${name}`);
      typesByName.set(name, row);
    }

    for (const challenge of SEEDED_CHALLENGES) {
      const type = typesByName.get(challenge.type);
      if (!type) throw new Error(`Missing challenge type: ${challenge.type}`);
      await upsertChallenge(challenge.name, challenge.description, type.id);
    }

    console.log('✅ Challenge types and challenges seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding challenge types:', error);
    throw error;
  }
}
