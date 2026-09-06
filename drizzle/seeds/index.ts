// Database connection is handled by individual seed files
import { seedSDGs } from './sdgs.js';
import { seedActivityTypes } from './activity-types.js';
import { seedEducationalAreas } from './educational-areas.js';
import { seedGroupSizes } from './group-sizes.js';
import { seedEffortLevels } from './effort-levels.js';
import { seedLocations } from './locations.js';
import { seedAgeGroups } from './age-groups.js';
import { seedDemoActivities } from './demo-activities.js';
import { client } from '@/lib/db/server';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    await seedSDGs();
    await seedActivityTypes();
    await seedEducationalAreas();
    await seedGroupSizes();
    await seedEffortLevels();
    await seedLocations();
    await seedAgeGroups();
    await seedDemoActivities();

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main();
