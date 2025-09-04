import { db } from '@/lib/db/server';
import { effortLevels } from '../../drizzle/schema/taxonomies';

export async function seedEffortLevels() {
  console.log('Seeding effort levels...');

  const effortLevelsData = [
    {
      name: 'Baixo',
      icon: '🟢',
    },
    {
      name: 'Médio',
      icon: '🟡',
    },
    {
      name: 'Alto',
      icon: '🔴',
    },
  ];

  for (const effortLevel of effortLevelsData) {
    await db.insert(effortLevels).values(effortLevel).onConflictDoNothing();
  }

  console.log('Effort levels seeded successfully');
}
