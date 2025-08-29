#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envContent = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/scout_toolkit_dev

# Authentication
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Development)
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret

# File Upload (Development)
UPLOADTHING_SECRET=your-dev-uploadthing-secret
UPLOADTHING_APP_ID=your-dev-uploadthing-app-id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_UPLOADTHING_URL=https://uploadthing.com

# Development Settings
NODE_ENV=development
`;

const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  console.log('⚠️  .env.local already exists. Skipping creation.');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with default development configuration');
  console.log('📝 Please update the OAuth and UploadThing credentials as needed');
}

console.log('\n🚀 Next steps:');
console.log('1. Update .env.local with your actual credentials');
console.log('2. Run: docker-compose up -d');
console.log('3. Run: npm run db:migrate');
console.log('4. Run: npm run db:seed');
console.log('5. Run: npm run dev');

