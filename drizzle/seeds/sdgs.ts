import { db } from '@/lib/db';
import { sdgs } from '../schema/taxonomies';

// UN Sustainable Development Goals data
const sdgData = [
  {
    number: 1,
    name: { pt: 'Erradicar a Pobreza', en: 'No Poverty' },
    description: { pt: 'Acabar com a pobreza em todas as suas formas, em todos os lugares', en: 'End poverty in all its forms everywhere' },
    icon_url: '/sdg-icons/sdg-1.png',
  },
  {
    number: 2,
    name: { pt: 'Fome Zero', en: 'Zero Hunger' },
    description: { pt: 'Acabar com a fome, alcançar a segurança alimentar e melhoria da nutrição e promover a agricultura sustentável', en: 'End hunger, achieve food security and improved nutrition and promote sustainable agriculture' },
    icon_url: '/sdg-icons/sdg-2.png',
  },
  {
    number: 3,
    name: { pt: 'Saúde de Qualidade', en: 'Good Health and Well-being' },
    description: { pt: 'Garantir o acesso à saúde de qualidade e promover o bem-estar para todos, em todas as idades', en: 'Ensure healthy lives and promote well-being for all at all ages' },
    icon_url: '/sdg-icons/sdg-3.png',
  },
  {
    number: 4,
    name: { pt: 'Educação de Qualidade', en: 'Quality Education' },
    description: { pt: 'Garantir o acesso à educação inclusiva, de qualidade e equitativa, e promover oportunidades de aprendizagem ao longo da vida para todos', en: 'Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all' },
    icon_url: '/sdg-icons/sdg-4.png',
  },
  {
    number: 5,
    name: { pt: 'Igualdade de Género', en: 'Gender Equality' },
    description: { pt: 'Alcançar a igualdade de género e empoderar todas as mulheres e raparigas', en: 'Achieve gender equality and empower all women and girls' },
    icon_url: '/sdg-icons/sdg-5.png',
  },
  {
    number: 6,
    name: { pt: 'Água Potável e Saneamento', en: 'Clean Water and Sanitation' },
    description: { pt: 'Garantir a disponibilidade e gestão sustentável da água potável e do saneamento para todos', en: 'Ensure availability and sustainable management of water and sanitation for all' },
    icon_url: '/sdg-icons/sdg-6.png',
  },
  {
    number: 7,
    name: { pt: 'Energias Renováveis e Acessíveis', en: 'Affordable and Clean Energy' },
    description: { pt: 'Garantir o acesso a fontes de energia fiáveis, sustentáveis e modernas para todos', en: 'Ensure access to affordable, reliable, sustainable and modern energy for all' },
    icon_url: '/sdg-icons/sdg-7.png',
  },
  {
    number: 8,
    name: { pt: 'Trabalho Digno e Crescimento Económico', en: 'Decent Work and Economic Growth' },
    description: { pt: 'Promover o crescimento económico sustentado, inclusivo e sustentável, o emprego pleno e produtivo e o trabalho digno para todos', en: 'Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all' },
    icon_url: '/sdg-icons/sdg-8.png',
  },
  {
    number: 9,
    name: { pt: 'Indústria, Inovação e Infraestruturas', en: 'Industry, Innovation and Infrastructure' },
    description: { pt: 'Construir infraestruturas resilientes, promover a industrialização inclusiva e sustentável e fomentar a inovação', en: 'Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation' },
    icon_url: '/sdg-icons/sdg-9.png',
  },
  {
    number: 10,
    name: { pt: 'Reduzir as Desigualdades', en: 'Reduced Inequalities' },
    description: { pt: 'Reduzir as desigualdades no interior dos países e entre países', en: 'Reduce inequality within and among countries' },
    icon_url: '/sdg-icons/sdg-10.png',
  },
  {
    number: 11,
    name: { pt: 'Cidades e Comunidades Sustentáveis', en: 'Sustainable Cities and Communities' },
    description: { pt: 'Tornar as cidades e os assentamentos humanos inclusivos, seguros, resilientes e sustentáveis', en: 'Make cities and human settlements inclusive, safe, resilient and sustainable' },
    icon_url: '/sdg-icons/sdg-11.png',
  },
  {
    number: 12,
    name: { pt: 'Produção e Consumo Sustentáveis', en: 'Responsible Consumption and Production' },
    description: { pt: 'Garantir padrões de consumo e de produção sustentáveis', en: 'Ensure sustainable consumption and production patterns' },
    icon_url: '/sdg-icons/sdg-12.png',
  },
  {
    number: 13,
    name: { pt: 'Ação Climática', en: 'Climate Action' },
    description: { pt: 'Adotar medidas urgentes para combater as alterações climáticas e os seus impactos', en: 'Take urgent action to combat climate change and its impacts' },
    icon_url: '/sdg-icons/sdg-13.png',
  },
  {
    number: 14,
    name: { pt: 'Proteger a Vida Marinha', en: 'Life Below Water' },
    description: { pt: 'Conservar e usar de forma sustentável os oceanos, mares e os recursos marinhos para o desenvolvimento sustentável', en: 'Conserve and sustainably use the oceans, seas and marine resources for sustainable development' },
    icon_url: '/sdg-icons/sdg-14.png',
  },
  {
    number: 15,
    name: { pt: 'Proteger a Vida Terrestre', en: 'Life on Land' },
    description: { pt: 'Proteger, restaurar e promover o uso sustentável dos ecossistemas terrestres, gerir de forma sustentável as florestas, combater a desertificação, travar e reverter a degradação dos solos e travar a perda de biodiversidade', en: 'Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss' },
    icon_url: '/sdg-icons/sdg-15.png',
  },
  {
    number: 16,
    name: { pt: 'Paz, Justiça e Instituições Eficazes', en: 'Peace, Justice and Strong Institutions' },
    description: { pt: 'Promover sociedades pacíficas e inclusivas para o desenvolvimento sustentável, proporcionar o acesso à justiça para todos e construir instituições eficazes, responsáveis e inclusivas a todos os níveis', en: 'Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels' },
    icon_url: '/sdg-icons/sdg-16.png',
  },
  {
    number: 17,
    name: { pt: 'Parcerias para a Implementação dos Objetivos', en: 'Partnerships for the Goals' },
    description: { pt: 'Fortalecer os meios de implementação e revitalizar a parceria global para o desenvolvimento sustentável', en: 'Strengthen the means of implementation and revitalize the global partnership for sustainable development' },
    icon_url: '/sdg-icons/sdg-17.png',
  },
];

export async function seedSDGs() {
  console.log('📊 Seeding SDGs...');
  
  try {
    for (const sdg of sdgData) {
      await db.insert(sdgs).values({
        number: sdg.number,
        name: JSON.stringify(sdg.name),
        description: JSON.stringify(sdg.description),
        icon_url: sdg.icon_url,
      }).onConflictDoNothing();
    }
    
    console.log('✅ SDGs seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding SDGs:', error);
    throw error;
  }
}
