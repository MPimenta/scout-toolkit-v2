// Database connection is handled by individual seed files
import { seedSDGs } from './sdgs.js';
import { seedActivityTypes } from './activity-types.js';
import { seedEducationalAreas } from './educational-areas.js';
import { seedDemoActivities } from './demo-activities.js';

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed in order of dependencies
    await seedSDGs();
    await seedActivityTypes();
    await seedEducationalAreas();
    await seedDemoActivities();

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Note: Drizzle with postgres-js doesn't have a disconnect method
    // The connection is managed by the postgres client
  }
}

main();
