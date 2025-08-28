# Project Planning & Development Roadmap

## Overview

This document outlines the development phases, milestones, and detailed task breakdown for the Scout Activities Platform. The project is organized into phases with clear deliverables and acceptance criteria.

## Development Phases

### Phase 1: MVP Foundation (2-3 weeks)
**Goal:** Core functionality with basic auth and activity browsing

### Phase 2: Enhanced Features (2-3 weeks)
**Goal:** Advanced features, program builder, and exports

### Phase 3: Advanced Features (2-3 weeks)
**Goal:** User-generated content, edit suggestions, and optimizations

## Detailed Backlog

### Epic 1: Project Setup & Infrastructure

#### Story 1.1: Repository Scaffold ✅
**Priority:** Critical
**Estimate:** 1 day
**Status:** Completed
**Acceptance Criteria:**
- [x] Next.js 15 project with TypeScript
- [x] Tailwind CSS and shadcn/ui configured
- [x] ESLint and Prettier setup
- [x] Basic folder structure
- [x] Environment configuration
- [x] OpenAPI/Swagger documentation setup

**Tasks:**
- [x] Initialize Next.js project with App Router
- [x] Install and configure Tailwind CSS
- [x] Install shadcn/ui components
- [x] Setup ESLint and Prettier
- [x] Create folder structure
- [x] Configure environment variables
- [x] Install and configure OpenAPI documentation

**Completed:** 2025-08-28

#### Story 1.2: Database Setup
**Priority:** Critical
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] PostgreSQL connection configured
- [ ] Drizzle ORM setup with schema
- [ ] Database migrations working
- [ ] Seed scripts for demo data
- [ ] SDG data imported

**Tasks:**
- [ ] Install and configure Drizzle ORM
- [ ] Create database schema
- [ ] Setup database migrations
- [ ] Create seed scripts
- [ ] Import SDG data from UN sources
- [ ] Create demo activities

#### Story 1.3: Authentication Setup ✅
**Priority:** Critical
**Estimate:** 2 days
**Status:** Completed (with temporary workaround)
**Acceptance Criteria:**
- [x] Auth.js configured with Google provider
- [x] Domain restriction for @escoteiros.pt emails
- [x] Role-based access control
- [x] Protected routes middleware
- [x] Login/logout functionality

**Tasks:**
- [x] Install and configure Auth.js
- [x] Setup Google OAuth provider
- [x] Implement domain restriction
- [x] Create user roles system
- [x] Setup middleware for protected routes
- [x] Create login/logout components

**Notes:**
- NextAuth v5 beta has compatibility issues with Next.js 15
- Authentication components and configuration are complete but temporarily disabled
- Will need to resolve NextAuth compatibility or downgrade to NextAuth v4 when stable
- All authentication logic, middleware, and UI components are implemented and ready

**Completed:** 2025-08-28

#### Story 1.4: Internationalization Setup
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] next-intl configured
- [ ] Locale routing working
- [ ] Translation dictionaries setup
- [ ] Language switcher component
- [ ] Default Portuguese locale

**Tasks:**
- [ ] Install and configure next-intl
- [ ] Setup locale routing
- [ ] Create translation dictionaries
- [ ] Build language switcher
- [ ] Test locale switching

#### Epic 1 Quality Check
**Priority:** High
**Estimate:** 2 hours
**Recurring Tasks:**
- [ ] Code review and refactoring
- [ ] Test coverage verification
- [ ] Performance baseline check
- [ ] Documentation update

### Epic 2: Core UI & Layout

#### Story 2.1: Base Layout & Navigation
**Priority:** Critical
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Top navbar with logo
- [ ] Language switcher
- [ ] Auth status display
- [ ] Responsive design
- [ ] Navigation links

**Tasks:**
- [ ] Create main layout component
- [ ] Build top navbar
- [ ] Add language switcher
- [ ] Display auth status
- [ ] Make responsive

#### Story 2.2: Design System
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Color palette defined
- [ ] Typography system
- [ ] Component variants
- [ ] Consistent spacing
- [ ] Dark mode support (future)

**Tasks:**
- [ ] Define color tokens
- [ ] Setup typography scale
- [ ] Create component variants
- [ ] Document design system

### Epic 3: Activities Browsing

#### Story 3.1: Activities List Page
**Priority:** Critical
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Activities displayed in tiles view
- [ ] Basic activity cards with image
- [ ] Activity attributes displayed
- [ ] Responsive grid layout
- [ ] Loading states

**Tasks:**
- [ ] Create activities list page
- [ ] Build activity card component
- [ ] Display activity attributes
- [ ] Add loading states
- [ ] Make responsive

#### Story 3.2: Search & Filtering
**Priority:** Critical
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Text search functionality
- [ ] Filter by duration, effort, group size
- [ ] Multi-select filters
- [ ] Clear filters action
- [ ] Server-side search with caching

**Tasks:**
- [ ] Implement text search
- [ ] Create filter components
- [ ] Build search API endpoint
- [ ] Add filter logic
- [ ] Implement caching

#### Story 3.3: Table View
**Priority:** Medium
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] TanStack Table implementation
- [ ] Sortable columns
- [ ] Pagination
- [ ] View toggle (tiles/table)
- [ ] Export table data

**Tasks:**
- [ ] Install TanStack Table
- [ ] Create table component
- [ ] Add sorting functionality
- [ ] Implement pagination
- [ ] Add view toggle

#### Story 3.4: Activity Details
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Detailed activity view
- [ ] All activity information displayed
- [ ] Educational goals and SDGs
- [ ] Rating and comments section
- [ ] Add to program button

**Tasks:**
- [ ] Create activity detail page
- [ ] Display all activity data
- [ ] Show educational goals and SDGs
- [ ] Add rating component
- [ ] Implement add to program

### Epic 4: Program Builder

#### Story 4.1: Program CRUD
**Priority:** Critical
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Create new programs
- [ ] Edit existing programs
- [ ] Delete programs
- [ ] List user's programs
- [ ] Program metadata management

**Tasks:**
- [ ] Create program model
- [ ] Build program CRUD API
- [ ] Create program management UI
- [ ] Add program list view
- [ ] Implement program deletion

#### Story 4.2: Program Builder Interface
**Priority:** Critical
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Drag and drop reordering
- [ ] Add activities to program
- [ ] Add custom blocks
- [ ] Edit program entries
- [ ] Auto time calculation

**Tasks:**
- [ ] Install dnd-kit
- [ ] Create program builder UI
- [ ] Implement drag and drop
- [ ] Add activity selection
- [ ] Create custom block editor

#### Story 4.3: Program Schedule Display
**Priority:** High
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Schedule table view
- [ ] Time calculations
- [ ] Activity information display
- [ ] Summary section
- [ ] Educational goals and SDGs summary

**Tasks:**
- [ ] Create schedule table
- [ ] Implement time calculations
- [ ] Display activity details
- [ ] Build summary component
- [ ] Show goals and SDGs

#### Story 4.4: Add to Program from Browse
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Add to program button on activities
- [ ] Program selection modal
- [ ] Create new program option
- [ ] Success feedback
- [ ] Navigate to program builder

**Tasks:**
- [ ] Add button to activity cards
- [ ] Create program selection modal
- [ ] Implement add to program logic
- [ ] Add success notifications
- [ ] Handle navigation

### Epic 5: Export Functionality

#### Story 5.1: Excel Export
**Priority:** High
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Export program to Excel
- [ ] Multiple sheets (schedule, summary)
- [ ] Proper formatting
- [ ] Activity details included
- [ ] Download functionality

**Tasks:**
- [ ] Install SheetJS
- [ ] Create Excel export API
- [ ] Format program data
- [ ] Generate multiple sheets
- [ ] Add download functionality

#### Story 5.2: PDF Export
**Priority:** High
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Export program to PDF
- [ ] Print-optimized styling
- [ ] Program summary page
- [ ] Schedule table
- [ ] High-quality output

**Tasks:**
- [ ] Install Playwright
- [ ] Create PDF generation API
- [ ] Design print styles
- [ ] Generate PDF content
- [ ] Test PDF quality

### Epic 6: User Feedback System

#### Story 6.1: Rating System
**Priority:** Medium
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Star rating component
- [ ] Submit ratings
- [ ] Display average ratings
- [ ] User rating history
- [ ] Rating validation

**Tasks:**
- [ ] Create star rating component
- [ ] Build rating API
- [ ] Display average ratings
- [ ] Show user ratings
- [ ] Add validation

#### Story 6.2: Comments System
**Priority:** Medium
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Comment form
- [ ] Display comments
- [ ] Edit/delete own comments
- [ ] Comment moderation
- [ ] Rich text support

**Tasks:**
- [ ] Create comment components
- [ ] Build comment API
- [ ] Add edit/delete functionality
- [ ] Implement moderation
- [ ] Add rich text editor

### Epic 7: Public Programs

#### Story 7.1: Public Program Gallery
**Priority:** Medium
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Browse public programs
- [ ] Program preview
- [ ] Search public programs
- [ ] Filter by criteria
- [ ] Program metadata display

**Tasks:**
- [ ] Create public programs page
- [ ] Build program preview
- [ ] Add search functionality
- [ ] Implement filters
- [ ] Display program info

#### Story 7.2: Use as Template
**Priority:** Medium
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Copy public program
- [ ] Create new program from template
- [ ] Customize copied program
- [ ] Attribution to original creator
- [ ] Success feedback

**Tasks:**
- [ ] Implement copy functionality
- [ ] Create template API
- [ ] Add customization options
- [ ] Show attribution
- [ ] Add success notifications

### Epic 8: Admin Features

#### Story 8.1: Admin Dashboard
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] Admin-only access
- [ ] Dashboard overview
- [ ] Quick stats
- [ ] Navigation to admin features
- [ ] Role verification

**Tasks:**
- [ ] Create admin dashboard
- [ ] Add access control
- [ ] Display statistics
- [ ] Build navigation
- [ ] Verify admin role

#### Story 8.2: Activity Management
**Priority:** High
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] CRUD activities
- [ ] Image upload
- [ ] Educational goals assignment
- [ ] SDG assignment
- [ ] Approval workflow

**Tasks:**
- [ ] Create activity management UI
- [ ] Implement CRUD operations
- [ ] Add image upload
- [ ] Build goal assignment
- [ ] Add approval system

#### Story 8.3: Taxonomy Management
**Priority:** Medium
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] CRUD educational areas
- [ ] CRUD educational goals
- [ ] CRUD activity types
- [ ] CRUD SDGs
- [ ] Icon management

**Tasks:**
- [ ] Create taxonomy management UI
- [ ] Build CRUD operations
- [ ] Add icon upload
- [ ] Implement relationships
- [ ] Add validation

#### Story 8.4: User Management
**Priority:** Medium
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] List all users
- [ ] Assign roles
- [ ] View user activity
- [ ] User statistics
- [ ] Role management

**Tasks:**
- [ ] Create user management UI
- [ ] Build role assignment
- [ ] Add user activity tracking
- [ ] Display statistics
- [ ] Implement role changes

### Epic 9: Advanced Features

#### Story 9.1: Edit Suggestions
**Priority:** Low
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Suggest edits to activities
- [ ] Review suggestions
- [ ] Accept/reject suggestions
- [ ] Notification system
- [ ] Suggestion history

**Tasks:**
- [ ] Create suggestion system
- [ ] Build review interface
- [ ] Add notification system
- [ ] Implement approval workflow
- [ ] Track suggestion history

#### Story 9.2: User-Generated Content
**Priority:** Low
**Estimate:** 3 days
**Acceptance Criteria:**
- [ ] Users create activities
- [ ] Approval workflow
- [ ] Edit own activities
- [ ] Content moderation
- [ ] Attribution system

**Tasks:**
- [ ] Create activity creation UI
- [ ] Build approval workflow
- [ ] Add editing capabilities
- [ ] Implement moderation
- [ ] Add attribution

### Epic 10: Testing & Quality

#### Story 10.1: API Documentation
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] OpenAPI 3.0 specification complete
- [ ] Swagger UI accessible at /api/docs
- [ ] All endpoints documented with examples
- [ ] Authentication flow documented
- [ ] Schema definitions for all models
- [ ] Export functionality for OpenAPI spec

**Tasks:**
- [ ] Install swagger-jsdoc and swagger-ui-react
- [ ] Create OpenAPI specification
- [ ] Document all API endpoints
- [ ] Add request/response examples
- [ ] Setup Swagger UI route
- [ ] Test interactive documentation

#### Story 10.2: Unit Testing
**Priority:** High
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Core business logic tested
- [ ] Component testing
- [ ] Utility function testing
- [ ] 80% coverage target
- [ ] CI integration

**Tasks:**
- [ ] Setup Vitest
- [ ] Write component tests
- [ ] Test business logic
- [ ] Add CI integration
- [ ] Monitor coverage

#### Story 10.3: Integration Testing
**Priority:** Medium
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] API endpoint testing
- [ ] Database operation testing
- [ ] Auth flow testing
- [ ] Error handling testing
- [ ] Performance testing

**Tasks:**
- [ ] Create API tests
- [ ] Test database operations
- [ ] Test auth flows
- [ ] Add error tests
- [ ] Performance benchmarks

#### Story 10.4: E2E Testing
**Priority:** Medium
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Critical user flows tested
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Accessibility testing
- [ ] Performance testing

**Tasks:**
- [ ] Setup Playwright
- [ ] Write critical flow tests
- [ ] Add cross-browser tests
- [ ] Test accessibility
- [ ] Performance testing

### Epic 11: Performance & Optimization

#### Story 11.1: Performance Optimization
**Priority:** Medium
**Estimate:** 2 days
**Acceptance Criteria:**
- [ ] Image optimization
- [ ] Code splitting
- [ ] Bundle optimization
- [ ] Caching strategy
- [ ] Lighthouse scores ≥90

**Tasks:**
- [ ] Optimize images
- [ ] Implement code splitting
- [ ] Optimize bundles
- [ ] Add caching
- [ ] Monitor performance

#### Story 11.2: Accessibility
**Priority:** High
**Estimate:** 1 day
**Acceptance Criteria:**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management
- [ ] Color contrast

**Tasks:**
- [ ] Audit accessibility
- [ ] Add keyboard support
- [ ] Improve screen reader support
- [ ] Fix focus issues
- [ ] Check contrast

#### Epic 11 Quality Check
**Priority:** High
**Estimate:** 2 hours
**Recurring Tasks:**
- [ ] Code review and refactoring
- [ ] Test coverage verification
- [ ] Performance baseline check
- [ ] Documentation update

### Epic 12: Quality Assurance & Optimization (Recurring)

#### Story 12.1: Technical Debt Assessment
**Priority:** Medium
**Estimate:** 1 day
**Frequency:** Every 2-3 weeks
**Acceptance Criteria:**
- [ ] Code quality audit completed
- [ ] Technical debt identified and documented
- [ ] Refactoring priorities established
- [ ] Performance bottlenecks identified
- [ ] Security vulnerabilities assessed

**Tasks:**
- [ ] Run code quality tools (ESLint, SonarQube)
- [ ] Review complex functions and components
- [ ] Identify code smells and anti-patterns
- [ ] Document technical debt items
- [ ] Prioritize refactoring tasks

#### Story 12.2: Performance Optimization Sprint
**Priority:** Medium
**Estimate:** 2 days
**Frequency:** Every 3-4 weeks
**Acceptance Criteria:**
- [ ] Performance metrics measured
- [ ] Bottlenecks identified and addressed
- [ ] Database query optimization
- [ ] Frontend performance improvements
- [ ] Caching strategy optimization

**Tasks:**
- [ ] Run performance audits (Lighthouse, WebPageTest)
- [ ] Analyze database query performance
- [ ] Optimize bundle size and loading
- [ ] Implement/improve caching strategies
- [ ] Monitor Core Web Vitals

#### Story 12.3: Test Coverage Improvement
**Priority:** High
**Estimate:** 1 day
**Frequency:** Every 2 weeks
**Acceptance Criteria:**
- [ ] Test coverage report generated
- [ ] Coverage gaps identified
- [ ] Critical paths tested
- [ ] Integration tests added
- [ ] Test quality improved

**Tasks:**
- [ ] Generate coverage reports
- [ ] Identify untested critical paths
- [ ] Add missing unit tests
- [ ] Improve integration test coverage
- [ ] Review and improve test quality

#### Story 12.4: Code Quality Audit
**Priority:** Medium
**Estimate:** 1 day
**Frequency:** Every 2 weeks
**Acceptance Criteria:**
- [ ] Code review standards enforced
- [ ] Documentation updated
- [ ] Best practices compliance checked
- [ ] Security review completed
- [ ] Accessibility audit performed

**Tasks:**
- [ ] Review code against standards
- [ ] Update documentation
- [ ] Check security best practices
- [ ] Perform accessibility audit
- [ ] Update coding guidelines

## Milestones

### Milestone 1: MVP Launch (Week 3)
**Deliverables:**
- [ ] Basic authentication
- [ ] Activity browsing with filters
- [ ] Simple program builder
- [ ] Basic admin features
- [ ] Portuguese localization

**Success Criteria:**
- Users can browse activities
- Users can create basic programs
- Admins can manage content
- App is functional in Portuguese

### Milestone 2: Enhanced Features (Week 6)
**Deliverables:**
- [ ] Advanced search and filtering
- [ ] Program exports (Excel/PDF)
- [ ] Public program templates
- [ ] Rating and commenting
- [ ] English localization

**Success Criteria:**
- Full search functionality
- Export capabilities working
- Public program sharing
- User feedback system active

### Milestone 3: Production Ready (Week 9)
**Deliverables:**
- [ ] Complete testing suite
- [ ] Performance optimizations
- [ ] Accessibility compliance
- [ ] Advanced admin features
- [ ] Production deployment

**Success Criteria:**
- All tests passing
- Performance targets met
- Accessibility standards met
- Production deployment successful

## Risk Assessment

### High Risk
- **Domain restriction complexity** - Mitigation: Thorough testing of auth flow
- **PDF generation performance** - Mitigation: Use Vercel Edge Functions
- **Search performance** - Mitigation: Proper indexing and caching

### Medium Risk
- **Internationalization complexity** - Mitigation: Start simple, iterate
- **File upload security** - Mitigation: Strict validation and scanning
- **Database performance** - Mitigation: Monitor and optimize queries

### Low Risk
- **UI component complexity** - Mitigation: Use established libraries
- **Export format compatibility** - Mitigation: Test across platforms

## Success Metrics

### Technical Metrics
- **Performance:** Lighthouse scores ≥90
- **Reliability:** 99.9% uptime
- **Security:** No critical vulnerabilities
- **Accessibility:** WCAG 2.1 AA compliance

### User Metrics
- **Adoption:** 50+ active users in first month
- **Engagement:** Average session duration >5 minutes
- **Retention:** 70% weekly active users
- **Satisfaction:** 4.5+ star rating

### Business Metrics
- **Content:** 100+ activities in catalog
- **Programs:** 50+ programs created
- **Exports:** 200+ program exports
- **Feedback:** 100+ ratings and comments
