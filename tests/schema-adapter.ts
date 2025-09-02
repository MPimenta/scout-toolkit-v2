/**
 * Schema Adapter for PostgreSQL to SQLite Compatibility
 * 
 * This file handles the differences between PostgreSQL and SQLite schemas
 * to ensure our tests work correctly with the in-memory SQLite database.
 */

import { sql } from 'drizzle-orm'

// PostgreSQL-specific features that need adaptation for SQLite
export const POSTGRESQL_FEATURES = {
  // JSONB fields - SQLite doesn't have JSONB, so we use TEXT
  JSONB_TO_TEXT: (field: any) => sql`CAST(${field} AS TEXT)`,
  
  // Full-text search - SQLite has different syntax than PostgreSQL
  FTS_SEARCH: (field: any, query: string) => 
    sql`${field} LIKE ${`%${query}%`}`,
  
  // Array operations - SQLite doesn't have native array types
  ARRAY_CONTAINS: (field: any, value: any) => 
    sql`${field} LIKE ${`%${value}%`}`,
  
  // UUID handling - SQLite doesn't have native UUID type
  UUID_TO_TEXT: (field: any) => sql`CAST(${field} AS TEXT)`,
}

// SQLite Schema Creation Functions
export async function createSQLiteSchema(db: any) {
  try {
    // Create all tables in a single exec call for better performance
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS activity_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        materials TEXT,
        approximate_duration_minutes INTEGER,
        group_size TEXT,
        effort_level TEXT,
        location TEXT,
        age_group TEXT,
        activity_type_id TEXT,
        image_url TEXT,
        created_by TEXT,
        is_approved BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_type_id) REFERENCES activity_types(id)
      );
      
      CREATE TABLE IF NOT EXISTS sdgs (
        id TEXT PRIMARY KEY,
        number INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS educational_areas (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        icon TEXT,
        code TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS educational_goals (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT UNIQUE NOT NULL,
        area_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (area_id) REFERENCES educational_areas(id)
      );
      
      CREATE TABLE IF NOT EXISTS activity_sdgs (
        activity_id TEXT,
        sdg_id TEXT,
        PRIMARY KEY (activity_id, sdg_id),
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (sdg_id) REFERENCES sdgs(id)
      );
      
      CREATE TABLE IF NOT EXISTS activity_educational_goals (
        activity_id TEXT,
        goal_id TEXT,
        PRIMARY KEY (activity_id, goal_id),
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (goal_id) REFERENCES educational_goals(id)
      );
    `)
    
    console.log('SQLite schema created successfully')
  } catch (error) {
    console.warn('Failed to create SQLite schema:', error)
    throw error
  }
}

// Helper function to adapt PostgreSQL data for SQLite
export function adaptDataForSQLite(data: any): any {
  if (data === null || data === undefined) {
    return data
  }
  
  if (typeof data === 'object') {
    // Handle JSONB fields - convert to string for SQLite
    if (data.pt || data.en) {
      // This looks like a multilingual field, convert to JSON string
      return JSON.stringify(data)
    }
    
    // Handle other objects
    const adapted: any = {}
    for (const [key, value] of Object.entries(data)) {
      adapted[key] = adaptDataForSQLite(value)
    }
    return adapted
  }
  
  return data
}

// Helper function to adapt SQLite data back to PostgreSQL format
export function adaptDataFromSQLite(data: any): any {
  if (data === null || data === undefined) {
    return data
  }
  
  if (typeof data === 'string') {
    // Try to parse as JSON (for multilingual fields)
    try {
      const parsed = JSON.parse(data)
      if (parsed.pt || parsed.en) {
        return parsed
      }
    } catch {
      // Not JSON, return as-is
    }
  }
  
  if (typeof data === 'object') {
    const adapted: any = {}
    for (const [key, value] of Object.entries(data)) {
      adapted[key] = adaptDataFromSQLite(value)
    }
    return adapted
  }
  
  return data
}

// Test data factory functions
export const TEST_DATA = {
  // Create test activity type
  createActivityType: (id: string, name: { pt: string; en: string }) => ({
    id,
    name: JSON.stringify(name), // Store as JSON string for SQLite
    description: JSON.stringify({ pt: 'Test description', en: 'Test description' }),
  }),
  
  // Create test activity
  createActivity: (id: string, name: { pt: string; en: string }) => ({
    id,
    name: JSON.stringify(name),
    description: JSON.stringify({ pt: 'Test activity description', en: 'Test activity description' }),
    materials: JSON.stringify({ pt: 'Test materials', en: 'Test materials' }),
    approximate_duration_minutes: 30,
    group_size: 'medium',
    effort_level: 'low',
    location: 'inside',
    age_group: 'scouts',
    activity_type_id: 'test-type-id',
    is_approved: true,
  }),
  
  // Create test SDG
  createSDG: (id: string, number: number, name: { pt: string; en: string }) => ({
    id,
    number,
    name: JSON.stringify(name),
    description: JSON.stringify({ pt: 'Test SDG description', en: 'Test SDG description' }),
    icon_url: '/test-icon.png',
  }),
  
  // Create test educational goal
  createEducationalGoal: (id: string, title: { pt: string; en: string }, code: string) => ({
    id,
    title: JSON.stringify(title),
    description: JSON.stringify({ pt: 'Test goal description', en: 'Test goal description' }),
    code,
    area_id: 'test-area-id',
  }),
}
