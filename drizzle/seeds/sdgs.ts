import * as dotenv from 'dotenv';
import { db } from '@/lib/db/server';
import { sdgs } from '../schema/taxonomies';

// Load environment variables
dotenv.config({ path: '.env.local' });

// UN Sustainable Development Goals data
const sdgData = [
  {
    number: 1,
    name: 'Erradicar a Pobreza',
    description: 'Acabar com a pobreza em todas as suas formas, em todos os lugares',
    icon_url: '/sdg-icons/sdg-1.png',
  },
  {
    number: 2,
    name: 'Fome Zero',
    description: 'Acabar com a fome, alcançar a segurança alimentar e melhoria da nutrição e promover a agricultura sustentável',
    icon_url: '/sdg-icons/sdg-2.png',
  },
  {
    number: 3,
    name: 'Saúde de Qualidade',
    description: 'Garantir o acesso à saúde de qualidade e promover o bem-estar para todos, em todas as idades',
    icon_url: '/sdg-icons/sdg-3.png',
  },
  {
    number: 4,
    name: 'Educação de Qualidade',
    description: 'Garantir o acesso à educação inclusiva, de qualidade e equitativa, e promover oportunidades de aprendizagem ao longo da vida para todos',
    icon_url: '/sdg-icons/sdg-4.png',
  },
  {
    number: 5,
    name: 'Igualdade de Género',
    description: 'Alcançar a igualdade de género e empoderar todas as mulheres e raparigas',
    icon_url: '/sdg-icons/sdg-5.png',
  },
  {
    number: 6,
    name: 'Água Potável e Saneamento',
    description: 'Garantir a disponibilidade e gestão sustentável da água potável e do saneamento para todos',
    icon_url: '/sdg-icons/sdg-6.png',
  },
  {
    number: 7,
    name: 'Energias Renováveis e Acessíveis',
    description: 'Garantir o acesso a fontes de energia fiáveis, sustentáveis e modernas para todos',
    icon_url: '/sdg-icons/sdg-7.png',
  },
  {
    number: 8,
    name: 'Trabalho Digno e Crescimento Económico',
    description: 'Promover o crescimento económico sustentado, inclusivo e sustentável, o emprego pleno e produtivo e o trabalho digno para todos',
    icon_url: '/sdg-icons/sdg-8.png',
  },
  {
    number: 9,
    name: 'Indústria, Inovação e Infraestruturas',
    description: 'Construir infraestruturas resilientes, promover a industrialização inclusiva e sustentável e fomentar a inovação',
    icon_url: '/sdg-icons/sdg-9.png',
  },
  {
    number: 10,
    name: 'Reduzir as Desigualdades',
    description: 'Reduzir as desigualdades no interior dos países e entre países',
    icon_url: '/sdg-icons/sdg-10.png',
  },
  {
    number: 11,
    name: 'Cidades e Comunidades Sustentáveis',
    description: 'Tornar as cidades e os assentamentos humanos inclusivos, seguros, resilientes e sustentáveis',
    icon_url: '/sdg-icons/sdg-9.png',
  },
  {
    number: 12,
    name: 'Produção e Consumo Sustentáveis',
    description: 'Garantir padrões de consumo e de produção sustentáveis',
    icon_url: '/sdg-icons/sdg-12.png',
  },
  {
    number: 13,
    name: 'Ação Climática',
    description: 'Adotar medidas urgentes para combater as alterações climáticas e os seus impactos',
    icon_url: '/sdg-icons/sdg-13.png',
  },
  {
    number: 14,
    name: 'Proteger a Vida Marinha',
    description: 'Conservar e usar de forma sustentável os oceanos, mares e os recursos marinhos para o desenvolvimento sustentável',
    icon_url: '/sdg-icons/sdg-14.png',
  },
  {
    number: 15,
    name: 'Proteger a Vida Terrestre',
    description: 'Proteger, restaurar e promover o uso sustentável dos ecossistemas terrestres, gerir de forma sustentável as florestas, combater a desertificação, travar e reverter a degradação dos solos e travar a perda de biodiversidade',
    icon_url: '/sdg-icons/sdg-15.png',
  },
  {
    number: 16,
    name: 'Paz, Justiça e Instituições Eficazes',
    description: 'Promover sociedades pacíficas e inclusivas para o desenvolvimento sustentável, proporcionar o acesso à justiça para todos e construir instituições eficazes, responsáveis e inclusivas a todos os níveis',
    icon_url: '/sdg-icons/sdg-16.png',
  },
  {
    number: 17,
    name: 'Parcerias para a Implementação dos Objetivos',
    description: 'Fortalecer os meios de implementação e revitalizar a parceria global para o desenvolvimento sustentável',
    icon_url: '/sdg-icons/sdg-17.png',
  },
];

export async function seedSDGs() {
  console.log('📊 Seeding SDGs...');
  
  try {
    for (const sdg of sdgData) {
      await db.insert(sdgs).values({
        number: sdg.number,
        name: sdg.name,
        description: sdg.description,
        icon_url: sdg.icon_url,
      }).onConflictDoNothing();
    }
    
    console.log('✅ SDGs seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding SDGs:', error);
    throw error;
  }
}
