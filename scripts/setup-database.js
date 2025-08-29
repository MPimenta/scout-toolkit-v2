#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🚀 Setting up Scout Toolkit Database...\n');

  // Step 1: Create environment file if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  execSync('npm run setup:env', { stdio: 'inherit' });
} else {
  console.log('✅ .env.local already exists');
}

// Step 2: Start database container
console.log('\n🐳 Starting PostgreSQL container...');
try {
  execSync('docker-compose up -d', { stdio: 'inherit' });
  console.log('✅ Database container started');
} catch (error) {
  console.error('❌ Failed to start database container:', error.message);
  process.exit(1);
}

// Step 3: Wait for database to be ready
console.log('\n⏳ Waiting for database to be ready...');
let retries = 0;
const maxRetries = 30;

while (retries < maxRetries) {
  try {
    execSync('docker exec scout-postgres pg_isready -U postgres -d scout_toolkit_dev', { 
      stdio: 'pipe' 
    });
    console.log('✅ Database is ready');
    break;
  } catch (error) {
    retries++;
    if (retries >= maxRetries) {
      console.error('❌ Database failed to start within timeout');
      process.exit(1);
    }
    console.log(`⏳ Waiting... (${retries}/${maxRetries})`);
    // Use setTimeout for cross-platform compatibility
    const { setTimeout } = require('timers/promises');
    await setTimeout(2000);
  }
}

// Step 4: Run migrations
console.log('\n🔄 Running database migrations...');
try {
  execSync('npm run db:migrate', { stdio: 'inherit' });
  console.log('✅ Migrations completed');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}

// Step 5: Seed database
console.log('\n🌱 Seeding database with initial data...');
try {
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully');
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Database setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update .env.local with your actual OAuth and UploadThing credentials');
console.log('2. Run: npm run dev');
console.log('3. Visit: http://localhost:3000');
console.log('\n🔧 Useful commands:');
console.log('- npm run db:studio (Database GUI)');
console.log('- npm run db:stop (Stop database)');
console.log('- npm run db:reset (Reset database)');
}

setupDatabase().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
