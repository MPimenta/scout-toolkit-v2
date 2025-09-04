import { db } from '@/lib/db/server';
import { locations } from '../../drizzle/schema/taxonomies';

export async function seedLocations() {
  console.log('Seeding locations...');

  const locationsData = [
    {
      name: 'Interior',
      icon: '🏠',
    },
    {
      name: 'Exterior',
      icon: '🌳',
    },
    {
      name: 'Misto',
      icon: '🏕️',
    },
  ];

  for (const location of locationsData) {
    await db.insert(locations).values(location).onConflictDoNothing();
  }

  console.log('Locations seeded successfully');
}
