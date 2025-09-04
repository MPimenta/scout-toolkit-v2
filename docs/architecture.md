# Architecture & Technical Decisions

## Overview

This document outlines the technical architecture, stack choices, and key design decisions for the Scout Activities Platform - a web application for Portuguese scout leaders to browse activities, build programs, and manage content.

## Core Stack

### Frontend
- **Next.js 15 (App Router)** - React framework with server-side rendering, API routes, and excellent TypeScript support
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - Component library built on Radix UI primitives with Tailwind styling

### Backend & Database
- **PostgreSQL** - Relational database with excellent full-text search capabilities
- **Drizzle ORM** - Type-safe database toolkit with schema-first approach
- **Auth.js (NextAuth)** - Authentication library with Google OAuth provider

### State Management & Data Fetching
- **TanStack Query** - Server state management and caching
- **TanStack Table** - Powerful data grid for table views
- **Zustand** - Lightweight client state management for program builder

### Content & Localization
- **Portuguese-only interface** - All UI text and content in Portuguese
- **Direct routing** - Simple URL structure without locale prefixes
- **Hardcoded Portuguese content** - No translation system complexity

### File Storage & Media
- **UploadThing** - File upload service with S3 backend
- **Next.js Image** - Optimized image serving with fallbacks

### Search & Filtering
- **PostgreSQL Full-Text Search** - Built-in text search on activity content
- **pg_trgm extension** - Trigram matching for fuzzy search
- **Server-side search** - Debounced API calls with caching

### Export Functionality
- **SheetJS (xlsx)** - Excel export generation
- **Playwright** - PDF generation via HTML rendering
- **Vercel Edge Functions** - Serverless PDF generation

### Development Tools
- **ESLint + Prettier** - Code linting and formatting
- **Vitest** - Unit and integration testing with PostgreSQL
- **Playwright** - End-to-end testing
- **Drizzle Kit** - Database migrations and seeding
- **OpenAPI/Swagger** - API documentation and interactive testing

## Project Structure

### Directory Layout
```
scout-toolkit-v2/
├── docs/
│   ├── architecture.md
│   ├── planning.md
│   ├── deployment.md
│   └── api.md
├── src/
│   ├── app/
│   │   ├── activities/
│   │   ├── programs/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── features/
│   │   │   ├── activities/
│   │   │   ├── programs/
│   │   │   └── admin/
│   │   └── layout/
│   ├── lib/
│   │   ├── db/
│   │   ├── auth/
│   │   └── utils/
│   ├── types/
│   └── hooks/
├── drizzle/
│   ├── schema/
│   ├── migrations/
│   └── seeds/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── public/
    ├── images/
    └── sdg-icons/
```

### Key Directories Explained

#### `src/app/`
- **Direct routes** without locale prefixes
- **Activities pages** for browsing and viewing activities
- **Programs pages** for program builder and management
- **Admin pages** for content management (admin only)
- **API routes** for backend functionality

#### `src/components/`
- **`ui/`** - shadcn/ui components and color palette
- **`features/`** - Feature-specific components organized by domain
- **`layout/`** - Layout components (header, footer, navigation)

#### `src/lib/`
- **`db/`** - Database configuration, schema, and utilities
- **`auth/`** - Authentication configuration and utilities
- **`utils/`** - Shared utility functions

#### `drizzle/`
- **`schema/`** - Database schema definitions
- **`migrations/`** - Database migration files
- **`seeds/`** - Seed data for development and testing

#### `tests/`
- **`unit/`** - Unit tests for components and utilities
- **`integration/`** - Integration tests for API endpoints with PostgreSQL
- **`e2e/`** - End-to-end tests for user flows
- **`setup.ts`** - PostgreSQL test database setup and schema creation
- **`helpers/database.ts`** - Test database utilities and isolation

## Data Model

### Core Entities

#### Users & Authentication
```typescript
users {
  id: string (primary key)
  email: string (unique, @escoteiros.pt domain only)
  name: string
  image?: string
  created_at: timestamp
  updated_at: timestamp
}

user_roles {
  user_id: string (foreign key)
  role: 'user' | 'admin'
  created_at: timestamp
}
```

#### Activities
```typescript
activities {
  id: string (primary key)
  name: text // Portuguese activity name
  description: text // Portuguese activity description
  materials: text // Portuguese materials list
  approximate_duration_minutes: number
  group_size: 'small' | 'medium' | 'large'
  effort_level: 'low' | 'medium' | 'high'
  location: 'inside' | 'outside'
  age_group: 'cub_scouts' | 'scouts' | 'adventurers' | 'rovers' | 'leaders'
  activity_type_id: string (foreign key)
  image_url?: string
  created_at: timestamp
  updated_at: timestamp
  created_by?: string (foreign key to users)
  is_approved: boolean (default: true)
}
```

#### Taxonomies
```typescript
activity_types {
  id: string (primary key)
  name: text // Portuguese activity type name
  description?: text // Portuguese activity type description
  created_at: timestamp
}

educational_areas {
  id: string (primary key)
  name: text // Portuguese educational area name
  description?: text // Portuguese educational area description
  icon: string
  code: string (unique)
  created_at: timestamp
}

educational_goals {
  id: string (primary key)
  area_id: string (foreign key)
  title: text // Portuguese educational goal title
  description?: text // Portuguese educational goal description
  code: string (unique)
  icon: string // Icon for educational goal
  created_at: timestamp
}

sdgs {
  id: string (primary key)
  number: number (1-17, unique)
  name: text // Portuguese SDG name
  description: text // Portuguese SDG description
  icon_url: string
  icon: string // Additional icon field for consistency
  created_at: timestamp
}

// Additional taxonomy tables with icon support
group_sizes {
  id: string (primary key)
  name: string // e.g., "Pequeno (4-8)", "Médio (8-12)", "Grande (12+)"
  icon: string // e.g., "👥", "👨‍👩‍👧‍👦", "👥"
  created_at: timestamp
}

effort_levels {
  id: string (primary key)
  name: string // e.g., "Baixo", "Médio", "Alto"
  icon: string // e.g., "🟢", "🟡", "🔴"
  created_at: timestamp
}

locations {
  id: string (primary key)
  name: string // e.g., "Interior", "Exterior", "Misto"
  icon: string // e.g., "🏠", "🌳", "🏕️"
  created_at: timestamp
}

age_groups {
  id: string (primary key)
  name: string // e.g., "Lobitos", "Exploradores", "Pioneiros", "Caminheiros"
  icon: string // e.g., "🦁", "🌍", "🏔️", "🎯"
  created_at: timestamp
}
```

#### Many-to-Many Relationships
```typescript
activity_educational_goals {
  activity_id: string (foreign key)
  goal_id: string (foreign key)
  primary key: (activity_id, goal_id)
}

activity_sdgs {
  activity_id: string (foreign key)
  sdg_id: string (foreign key)
  primary key: (activity_id, sdg_id)
}
```

#### Programs
```typescript
programs {
  id: string (primary key)
  name: string
  date?: date
  start_time: time
  user_id: string (foreign key)
  is_public: boolean (default: false)
  created_at: timestamp
  updated_at: timestamp
}

program_entries {
  id: string (primary key)
  program_id: string (foreign key)
  position: number
  start_time: time
  end_time: time
  entry_type: 'activity' | 'custom'
  activity_id?: string (foreign key)
  custom_title?: string
  custom_duration_minutes?: number
  created_at: timestamp
}
```

#### User Feedback
```typescript
reviews {
  id: string (primary key)
  activity_id: string (foreign key)
  user_id: string (foreign key)
  rating: number (1-5)
  comment?: string
  created_at: timestamp
  updated_at: timestamp
  primary key: (activity_id, user_id)
}

edit_suggestions {
  id: string (primary key)
  activity_id: string (foreign key)
  user_id: string (foreign key)
  field: string
  suggested_value: jsonb
  status: 'pending' | 'approved' | 'rejected'
  created_at: timestamp
  reviewed_at?: timestamp
  reviewed_by?: string (foreign key to users)
}
```

### Database Indexes

#### Performance Indexes
```sql
-- Full-text search on activities
CREATE INDEX idx_activities_fts ON activities USING gin(to_tsvector('portuguese', name || ' ' || description || ' ' || materials));

-- Trigram indexes for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_activities_name_trgm ON activities USING gin(name gin_trgm_ops);
CREATE INDEX idx_activities_description_trgm ON activities USING gin(description gin_trgm_ops);

-- Filter indexes
CREATE INDEX idx_activities_group_size ON activities(group_size);
CREATE INDEX idx_activities_effort_level ON activities(effort_level);
CREATE INDEX idx_activities_location ON activities(location);
CREATE INDEX idx_activities_age_group ON activities(age_group);
CREATE INDEX idx_activities_duration ON activities(approximate_duration_minutes);
CREATE INDEX idx_activities_type ON activities(activity_type_id);

-- Program indexes
CREATE INDEX idx_programs_user ON programs(user_id);
CREATE INDEX idx_programs_public ON programs(is_public) WHERE is_public = true;
CREATE INDEX idx_program_entries_program ON program_entries(program_id);
CREATE INDEX idx_program_entries_position ON program_entries(program_id, position);

-- Review indexes
CREATE INDEX idx_reviews_activity ON reviews(activity_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

## Authentication & Authorization

### Auth.js Configuration
- **Provider:** Google OAuth
- **Domain Restriction:** Server-side validation for `@escoteiros.pt` emails
- **Session Strategy:** JWT with database persistence
- **Role-based Access:** User and Admin roles stored in database

### Authorization Flow
1. User signs in with Google
2. Server validates email domain
3. User record created/updated with role assignment
4. Session established with role information
5. Middleware gates protected routes

### Protected Routes
- `/admin/*` - Admin role required
- `/programs/*` - Authenticated users only
- `/api/admin/*` - Admin role required
- `/api/programs/*` - Authenticated users only

## Content Strategy

### Implementation
- **Language:** Portuguese-only interface
- **Routing:** Direct routes without locale prefixes (`/activities`, `/programs`)
- **Content Storage:** Simple text fields in Portuguese
- **No Translation System:** Simplified content management

### Content Storage
- **UI Strings:** Hardcoded Portuguese text in components
- **Content Fields:** Simple text columns in Portuguese
- **Example:**
```typescript
const activityName = "Nome da Atividade";
const activityDescription = "Descrição da atividade em português";
```

### URL Structure
- `/` - Homepage
- `/activities` - Activities list
- `/activities/[id]` - Activity details
- `/programs` - Programs list
- `/programs/[id]` - Program details
- `/admin/*` - Admin area

## Search & Filtering Strategy

### Search Implementation
- **Full-Text Search:** PostgreSQL FTS on name, description, materials
- **Fuzzy Search:** Trigram matching for typos and partial matches
- **Caching:** TanStack Query with 5-minute cache for search results
- **Debouncing:** 300ms delay on search input

### Filter Types
- **Text Search:** Name, description, materials
- **Duration:** Number input with operator (>, <, =)
- **Multi-select:** Effort level, group size, activity type, SDGs, educational goals
- **Single-select:** Location
- **Clear Filters:** Reset all applied filters

### Search Query Structure
```sql
SELECT a.*, 
       ts_rank(to_tsvector('portuguese', name || ' ' || description), plainto_tsquery('portuguese', $1)) as rank
FROM activities a
WHERE to_tsvector('portuguese', name || ' ' || description) @@ plainto_tsquery('portuguese', $1)
  AND group_size = ANY($2)
  AND effort_level = ANY($3)
  AND approximate_duration_minutes $4 $5
ORDER BY rank DESC, name;
```

## File Storage Strategy

### Image Upload Flow
1. **Client:** UploadThing widget for file selection
2. **UploadThing:** Processes and stores in S3
3. **Database:** Stores URL and metadata
4. **Serving:** Next.js Image component with optimization

### Image Requirements
- **Formats:** JPEG, PNG, WebP
- **Max Size:** 5MB per image
- **Dimensions:** Max 2048x2048px
- **Fallback:** Default placeholder image

### Storage Structure
```
s3://bucket/
├── activities/
│   ├── activity-1/
│   │   ├── original.jpg
│   │   └── thumbnail.jpg
│   └── activity-2/
└── sdg-icons/
    ├── sdg-1.png
    └── sdg-2.png
```

## Program Builder Table Layout

### Schedule Table Structure
The program builder uses a table-based layout for displaying program entries with drag and drop functionality:

#### Table Columns
- **Start Time**: Auto-calculated based on program start time + previous entries duration
- **End Time**: Auto-calculated based on start time + current entry duration  
- **Name**: Activity name or custom block title
- **Type**: Activity or Custom block indicator
- **Group Size**: Icon + size range (e.g., "👥 8-12")
- **Effort Level**: Icon + effort level (e.g., "🟡 Médio")
- **Location**: Icon + location (e.g., "🌳 Exterior")
- **Age Group**: Icon + age group (e.g., "🌍 Exploradores")
- **Duration**: Duration display (e.g., "1h 30m")
- **Goals**: Icon + educational goals (e.g., "🎯 Natureza")
- **SDGs**: Icon + SDG numbers (e.g., "🌱 15")
- **Actions**: Drag handle, edit, delete buttons

#### Drag and Drop Implementation
- **Library**: @dnd-kit for React drag and drop
- **Behavior**: Vertical-only reordering of table rows
- **Visual Feedback**: Drag handle, hover states, drop indicators
- **Time Recalculation**: Automatic start/end time updates after reordering
- **Mobile Support**: Touch-friendly drag handles and fallback buttons

#### Mobile Responsiveness
- **Horizontal Scroll**: Table scrolls horizontally on mobile devices
- **Touch Optimization**: Larger touch targets for drag handles and buttons
- **Stacked Layout**: Alternative stacked view for very small screens
- **Responsive Columns**: Hide less important columns on mobile

#### Icon System
- **Database Storage**: Icons stored as strings in taxonomy tables
- **Fallback Handling**: Default icons for missing values
- **Consistency**: Unified icon system across all taxonomy values
- **Customization**: Icons can be updated via admin interface

## Export Strategy

### Excel Export
- **Library:** SheetJS (xlsx)
- **Format:** .xlsx with multiple sheets
- **Content:** Program schedule, activity details, summary
- **Styling:** Basic formatting with headers and borders

### PDF Export
- **Library:** Playwright
- **Generation:** Server-side HTML rendering to PDF
- **Content:** Program schedule with summary page
- **Styling:** Print-optimized CSS

### Export Structure
```
Program: [Program Name]
Date: [Date]
Start Time: [Time]

Schedule:
| Time | Activity | Duration | Location | Effort | Type |
|------|----------|----------|----------|--------|------|
| 09:00 | Activity 1 | 30 min | Outside | Medium | Game |

Summary:
Educational Goals: [Goals]
SDGs: [SDG Icons]
```

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

### Lighthouse Scores
- **Performance:** ≥ 90
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 90
- **SEO:** ≥ 95

### Database Performance
- **Search Queries:** < 200ms
- **Filter Queries:** < 100ms
- **Program Loading:** < 500ms

## Security Considerations

### Authentication Security
- **Domain Restriction:** Server-side email validation
- **Session Security:** Secure, HTTP-only cookies
- **CSRF Protection:** Built-in Next.js protection

### Data Security
- **Input Validation:** Zod schemas for all inputs
- **SQL Injection:** Drizzle ORM prevents injection
- **XSS Protection:** React built-in protection
- **File Upload:** Type and size validation

### Authorization Security
- **Role-based Access:** Database-stored roles
- **Route Protection:** Middleware validation
- **API Security:** Server-side role checks

## Scalability Considerations

### Database Scaling
- **Read Replicas:** For search-heavy workloads
- **Connection Pooling:** PgBouncer for connection management
- **Query Optimization:** Proper indexing strategy

### Application Scaling
- **CDN:** Vercel Edge Network for static assets
- **Caching:** TanStack Query for API responses
- **Image Optimization:** Next.js automatic optimization

### Future Considerations
- **Microservices:** Separate services for search, exports
- **Real-time Features:** WebSocket integration for live updates
- **Mobile App:** React Native or PWA approach

## Monitoring & Observability

### Application Monitoring
- **Error Tracking:** Vercel Analytics
- **Performance Monitoring:** Core Web Vitals tracking
- **User Analytics:** Privacy-compliant analytics

### Database Monitoring
- **Query Performance:** Slow query logging
- **Connection Monitoring:** Connection pool metrics
- **Storage Monitoring:** Database size and growth

### Deployment Monitoring
- **Build Status:** GitHub Actions integration
- **Deployment Health:** Vercel deployment monitoring
- **Environment Health:** Health check endpoints
