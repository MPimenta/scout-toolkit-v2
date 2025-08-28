import { sql } from 'drizzle-orm';

// Database indexes for performance optimization
export const indexes = [
  // Full-text search on activities
  sql`
    CREATE INDEX IF NOT EXISTS idx_activities_fts 
    ON activities USING gin(
      to_tsvector('portuguese', 
        COALESCE(name->>'pt', '') || ' ' || 
        COALESCE(description->>'pt', '') || ' ' || 
        COALESCE(materials->>'pt', '')
      )
    );
  `,

  // Trigram indexes for fuzzy search
  sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
  
  sql`
    CREATE INDEX IF NOT EXISTS idx_activities_name_trgm 
    ON activities USING gin((name->>'pt') gin_trgm_ops);
  `,
  
  sql`
    CREATE INDEX IF NOT EXISTS idx_activities_description_trgm 
    ON activities USING gin((description->>'pt') gin_trgm_ops);
  `,

  // Filter indexes
  sql`CREATE INDEX IF NOT EXISTS idx_activities_group_size ON activities(group_size);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activities_effort_level ON activities(effort_level);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activities_location ON activities(location);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activities_age_group ON activities(age_group);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activities_duration ON activities(approximate_duration_minutes);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activities_approved ON activities(is_approved) WHERE is_approved = true;`,

  // Program indexes
  sql`CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_programs_public ON programs(is_public) WHERE is_public = true;`,
  sql`CREATE INDEX IF NOT EXISTS idx_program_entries_program ON program_entries(program_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_program_entries_position ON program_entries(program_id, position);`,

  // Review indexes
  sql`CREATE INDEX IF NOT EXISTS idx_reviews_activity ON reviews(activity_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);`,

  // Taxonomy indexes
  sql`CREATE INDEX IF NOT EXISTS idx_educational_goals_area ON educational_goals(area_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activity_educational_goals_activity ON activity_educational_goals(activity_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activity_educational_goals_goal ON activity_educational_goals(goal_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activity_sdgs_activity ON activity_sdgs(activity_id);`,
  sql`CREATE INDEX IF NOT EXISTS idx_activity_sdgs_sdg ON activity_sdgs(sdg_id);`,

  // User indexes
  sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,
];
