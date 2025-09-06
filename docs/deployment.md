# Deployment Guide

## Overview

This document outlines the complete deployment strategy for the Scout Activities Platform, from local development to production. The platform is designed to be deployed on Vercel with Neon PostgreSQL database and UploadThing for file storage. The application is built for Portuguese scout leaders with a Portuguese-only interface.

## Architecture Overview

### Production Stack
- **Frontend & API:** Vercel (Next.js)
- **Database:** Neon PostgreSQL
- **File Storage:** UploadThing (S3 backend)
- **Authentication:** Auth.js with Google OAuth
- **CDN:** Vercel Edge Network
- **Monitoring:** Vercel Analytics + Custom monitoring

### Development Stack
- **Local Database:** PostgreSQL via Docker
- **Local Development:** Next.js dev server
- **File Storage:** UploadThing development environment
- **Testing:** PostgreSQL test database with dedicated test user and schema isolation

## Environment Setup

### Environment Variables

#### Required Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Upload
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_UPLOADTHING_URL=https://uploadthing.com
```

#### Optional Variables
```env
# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Monitoring
SENTRY_DSN=https://your-sentry-dsn

# Feature Flags
ENABLE_USER_GENERATED_CONTENT=false
ENABLE_EDIT_SUGGESTIONS=false
```

### Environment Files

#### Development (.env.local)
```env
# Copy from .env.example and fill in your values
DATABASE_URL=postgresql://postgres:password@localhost:5432/scout_toolkit_dev
NEXTAUTH_SECRET=dev-secret-key
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-dev-google-client-id
GOOGLE_CLIENT_SECRET=your-dev-google-client-secret
UPLOADTHING_SECRET=your-dev-uploadthing-secret
UPLOADTHING_APP_ID=your-dev-uploadthing-app-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Production (.env.production)
```env
# Set these in Vercel dashboard
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret
UPLOADTHING_SECRET=your-production-uploadthing-secret
UPLOADTHING_APP_ID=your-production-uploadthing-app-id
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Docker (for local PostgreSQL)
- Git

### Step 1: Clone and Install
```bash
git clone https://github.com/your-org/scout-toolkit-v2.git
cd scout-toolkit-v2
pnpm install
```

### Step 2: Database Setup
```bash
# Start PostgreSQL with Docker
docker run --name scout-postgres \
  -e POSTGRES_DB=scout_toolkit_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Wait for database to be ready
sleep 10

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

**Note:** The testing infrastructure uses a separate test database (`scout_toolkit_test`) with dedicated user credentials for isolated testing.

### Step 3: Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
# Get Google OAuth credentials from Google Cloud Console
# Get UploadThing credentials from uploadthing.com
```

### Step 4: Start Development Server
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Database Setup

### Neon PostgreSQL (Production)

#### 1. Create Neon Account
1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. Note your connection string

#### 2. Configure Database
```bash
# Set production database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Run migrations
pnpm db:migrate

# Seed production data
pnpm db:seed:production
```

#### 3. Database Configuration
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_activities_fts ON activities 
USING gin(to_tsvector('portuguese', name->>'pt' || ' ' || description->>'pt' || ' ' || materials->>'pt'));

CREATE INDEX CONCURRENTLY idx_activities_name_trgm ON activities 
USING gin((name->>'pt') gin_trgm_ops);
```

### Local PostgreSQL (Development)

#### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: scout_toolkit_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Start database
docker-compose up -d

# Run migrations
pnpm db:migrate

# Seed data
pnpm db:seed
```

## File Storage Setup

### UploadThing Configuration

#### 1. Create UploadThing Account
1. Go to [uploadthing.com](https://uploadthing.com)
2. Create account and new project
3. Get API keys

#### 2. Configure UploadThing
```typescript
// lib/uploadthing.ts
import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const { UploadButton, UploadDropzone, Uploader } = generateComponents<OurFileRouter>();
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();
```

#### 3. Environment Variables
```env
UPLOADTHING_SECRET=your-secret-key
UPLOADTHING_APP_ID=your-app-id
```

## Authentication Setup

### Google OAuth Configuration

#### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials

#### 2. Configure OAuth
```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Validate email domain
      if (!user.email?.endsWith('@escoteiros.pt')) {
        return false;
      }
      return true;
    },
  },
};
```

#### 3. Environment Variables
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## Vercel Deployment

### 1. Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings

### 2. Environment Variables
Set all production environment variables in Vercel dashboard:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_APP_ID`
- `NEXT_PUBLIC_APP_URL`

### 3. Build Configuration
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "functions": {
    "app/api/programs/[id]/export/pdf/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 4. Deploy
```bash
# Deploy to Vercel
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Required Secrets
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Monitoring & Analytics

### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Custom Monitoring
```typescript
// lib/monitoring.ts
export function trackEvent(event: string, properties?: Record<string, any>) {
  // Send to your analytics service
  console.log('Event:', event, properties);
}

export function trackError(error: Error, context?: Record<string, any>) {
  // Send to error tracking service
  console.error('Error:', error, context);
}
```

### Health Checks
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    }, { status: 500 });
  }
}
```

## Performance Optimization

### Image Optimization
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['uploadthing.com', 'your-s3-bucket.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
```

### Database Optimization
```sql
-- Connection pooling
-- Use PgBouncer for connection management
-- Configure in neon.tech dashboard

-- Query optimization
EXPLAIN ANALYZE SELECT * FROM activities WHERE group_size = 'medium';

-- Index optimization
CREATE INDEX CONCURRENTLY idx_activities_composite 
ON activities(group_size, effort_level, location);
```

### Caching Strategy
```typescript
// lib/cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedActivities = unstable_cache(
  async (filters: ActivityFilters) => {
    return await getActivities(filters);
  },
  ['activities'],
  {
    revalidate: 300, // 5 minutes
    tags: ['activities']
  }
);
```

## Security Configuration

### Security Headers
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function rateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

## Backup Strategy

### Database Backups
```bash
# Automated backups with Neon
# Neon provides automatic daily backups
# Manual backup command
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_20240115_100000.sql
```

### File Storage Backups
- UploadThing automatically backs up to S3
- Configure S3 lifecycle policies for cost optimization
- Cross-region replication for disaster recovery

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
SELECT * FROM pg_stat_activity WHERE datname = 'scout_toolkit';
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
pnpm build

# Check for missing dependencies
pnpm install --frozen-lockfile
```

#### Authentication Issues
```bash
# Check environment variables
echo $NEXTAUTH_SECRET
echo $GOOGLE_CLIENT_ID

# Test OAuth flow
curl -X POST http://localhost:3000/api/auth/signin/google
```

### Performance Issues
```bash
# Check bundle size
pnpm build
# Look for large chunks in .next/static/chunks/

# Check database performance
EXPLAIN ANALYZE SELECT * FROM activities WHERE search_vector @@ plainto_tsquery('portuguese', 'game');
```

### Monitoring Commands
```bash
# Check application health
curl https://your-domain.com/api/health

# Check database status
curl https://your-domain.com/api/health/database

# Monitor logs
vercel logs --follow
```

## Scaling Considerations

### Horizontal Scaling
- Vercel automatically scales based on traffic
- Database read replicas for search-heavy workloads
- CDN for static assets

### Vertical Scaling
- Upgrade Neon database plan for more resources
- Optimize database queries and indexes
- Implement caching strategies

### Cost Optimization
- Monitor Vercel usage and optimize functions
- Use Neon's serverless scaling
- Implement proper caching to reduce database calls
- Optimize image sizes and formats

## Disaster Recovery

### Recovery Procedures
1. **Database Recovery**
   - Restore from Neon backup
   - Verify data integrity
   - Update application if needed

2. **Application Recovery**
   - Redeploy from Git repository
   - Verify environment variables
   - Test critical functionality

3. **File Recovery**
   - Restore from S3 backup
   - Update file references in database
   - Verify file accessibility

### Business Continuity
- Maintain backup deployment environment
- Document recovery procedures
- Regular disaster recovery testing
- Monitor system health continuously
