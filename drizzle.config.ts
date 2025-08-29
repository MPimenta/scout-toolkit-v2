import { defineConfig } from 'drizzle-kit';

// Only load dotenv in Node.js environment
if (typeof process !== 'undefined') {
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
}

export default defineConfig({
  schema: './drizzle/schema/*',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
