// Database connection is handled by individual seed files
import { seedSDGs } from './sdgs.js';
import { seedActivityTypes } from './activity-types.js';
import { seedGroupSizes } from './group-sizes.js';
import { seedEffortLevels } from './effort-levels.js';
import { seedLocations } from './locations.js';
import { seedAgeGroups } from './age-groups.js';
import { seedDemoActivities } from './demo-activities.js';
import { client, db } from '@/lib/db/server';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';
import { applyActivitySources } from '@/lib/reference-data/activity-sources';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    await seedSDGs();
    await seedActivityTypes();
    // Areas, paths, objectives and desafios come from the Matriz dataset (idempotent).
    await applyProgressMatrix(db);
    await applyActivitySources(db);
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
