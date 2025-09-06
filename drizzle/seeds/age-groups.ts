import { db } from '@/lib/db/server';
import { ageGroups } from '../../drizzle/schema/taxonomies';

export async function seedAgeGroups() {
  console.log('Seeding age groups...');

  const ageGroupsData = [
    {
      name: 'Lobitos',
      icon: '🦁',
    },
    {
      name: 'Exploradores',
      icon: '🌍',
    },
    {
      name: 'Pioneiros',
      icon: '🏔️',
    },
    {
      name: 'Caminheiros',
      icon: '🎯',
    },
    {
      name: 'Dirigentes',
      icon: '👨‍🏫',
    },
  ];

  for (const ageGroup of ageGroupsData) {
    await db.insert(ageGroups).values(ageGroup).onConflictDoNothing();
  }

  console.log('Age groups seeded successfully');
}
