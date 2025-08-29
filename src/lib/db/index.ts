// Edge Runtime compatible database connection
// This file is for client-side imports that need database types
// For actual database operations, use src/lib/db/server.ts

import * as schema from '../../../drizzle/schema';

// Re-export schema for type usage
export { schema };

// Note: Actual database operations should use the server.ts file
// to avoid Edge Runtime compatibility issues
