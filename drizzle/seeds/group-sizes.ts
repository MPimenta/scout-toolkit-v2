import { db } from '@/lib/db/server';
import { groupSizes } from '../../drizzle/schema/taxonomies';

export async function seedGroupSizes() {
  console.log('Seeding group sizes...');

  const groupSizesData = [
    {
      name: 'Pequeno (4-8)',
      icon: '👥',
    },
    {
      name: 'Médio (8-12)',
      icon: '👨‍👩‍👧‍👦',
    },
    {
      name: 'Grande (12+)',
      icon: '👥',
    },
  ];

  for (const groupSize of groupSizesData) {
    await db.insert(groupSizes).values(groupSize).onConflictDoNothing();
  }

  console.log('Group sizes seeded successfully');
}
