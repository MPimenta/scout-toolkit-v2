const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

// Database connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function migrateJsonToText() {
  console.log('🚀 Starting JSON to Text migration...\n');

  try {
    // 1. Migrate activities table
    console.log('📝 Migrating activities table...');
    const activities = await sql`
      SELECT id, name, description, materials 
      FROM activities 
      WHERE name::text LIKE '%"pt"%' 
         OR description::text LIKE '%"pt"%' 
         OR materials::text LIKE '%"pt"%'
    `;
    
    for (const activity of activities) {
      const name = extractPortugueseText(activity.name);
      const description = extractPortugueseText(activity.description);
      const materials = extractPortugueseText(activity.materials);
      
      await sql`
        UPDATE activities 
        SET name = ${name}, description = ${description}, materials = ${materials}
        WHERE id = ${activity.id}
      `;
      console.log(`  ✅ Updated activity: ${name}`);
    }

    // 2. Migrate activity_types table
    console.log('\n📝 Migrating activity_types table...');
    const activityTypes = await sql`
      SELECT id, name, description 
      FROM activity_types 
      WHERE name::text LIKE '%"pt"%' 
         OR description::text LIKE '%"pt"%'
    `;
    
    for (const type of activityTypes) {
      const name = extractPortugueseText(type.name);
      const description = extractPortugueseText(type.description);
      
      await sql`
        UPDATE activity_types 
        SET name = ${name}, description = ${description}
        WHERE id = ${type.id}
      `;
      console.log(`  ✅ Updated activity type: ${name}`);
    }

    // 3. Migrate educational_areas table
    console.log('\n📝 Migrating educational_areas table...');
    const educationalAreas = await sql`
      SELECT id, name, description 
      FROM educational_areas 
      WHERE name::text LIKE '%"pt"%' 
         OR description::text LIKE '%"pt"%'
    `;
    
    for (const area of educationalAreas) {
      const name = extractPortugueseText(area.name);
      const description = extractPortugueseText(area.description);
      
      await sql`
        UPDATE educational_areas 
        SET name = ${name}, description = ${description}
        WHERE id = ${area.id}
      `;
      console.log(`  ✅ Updated educational area: ${name}`);
    }

    // 4. Migrate educational_goals table
    console.log('\n📝 Migrating educational_goals table...');
    const educationalGoals = await sql`
      SELECT id, title, description 
      FROM educational_goals 
      WHERE title::text LIKE '%"pt"%' 
         OR description::text LIKE '%"pt"%'
    `;
    
    for (const goal of educationalGoals) {
      const title = extractPortugueseText(goal.title);
      const description = extractPortugueseText(goal.description);
      
      await sql`
        UPDATE educational_goals 
        SET title = ${title}, description = ${description}
        WHERE id = ${goal.id}
      `;
      console.log(`  ✅ Updated educational goal: ${title}`);
    }

    // 5. Migrate sdgs table
    console.log('\n📝 Migrating sdgs table...');
    const sdgs = await sql`
      SELECT id, name, description 
      FROM sdgs 
      WHERE name::text LIKE '%"pt"%' 
         OR description::text LIKE '%"pt"%'
    `;
    
    for (const sdg of sdgs) {
      const name = extractPortugueseText(sdg.name);
      const description = extractPortugueseText(sdg.description);
      
      await sql`
        UPDATE sdgs 
        SET name = ${name}, description = ${description}
        WHERE id = ${sdg.id}
      `;
      console.log(`  ✅ Updated SDG: ${name}`);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('All JSON data has been converted to Portuguese text strings.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

function extractPortugueseText(jsonData) {
  if (!jsonData) return '';
  
  try {
    // If it's already a string, return it
    if (typeof jsonData === 'string') {
      // Check if it's a JSON string
      if (jsonData.startsWith('{') && jsonData.includes('"pt"')) {
        const parsed = JSON.parse(jsonData);
        return parsed.pt || parsed.en || jsonData;
      }
      return jsonData;
    }
    
    // If it's an object, extract Portuguese text
    if (typeof jsonData === 'object' && jsonData !== null) {
      return jsonData.pt || jsonData.en || JSON.stringify(jsonData);
    }
    
    return String(jsonData);
  } catch (error) {
    console.warn('⚠️  Could not parse JSON data:', jsonData);
    return String(jsonData);
  }
}

// Run the migration
if (require.main === module) {
  migrateJsonToText()
    .then(() => {
      console.log('\n✨ Migration script finished successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateJsonToText };
