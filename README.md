# Scout Activities Platform 🏕️

A modern web platform for Portuguese scout leaders to browse activities, build programs, and manage content. Built with Next.js 15, TypeScript, and PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

## ✨ Features

- **🎯 Activity Browsing** - Search and filter activities by various criteria
- **📋 Program Builder** - Create and manage event schedules with drag & drop
- **🇵🇹 Portuguese Interface** - Complete interface in Portuguese
- **📊 Export Functionality** - Export programs to Excel and PDF
- **⭐ Rating System** - Rate and comment on activities
- **👥 Public Programs** - Share and discover program templates
- **🔐 Secure Authentication** - eAEP (Orgo) membership login
- **👨‍💼 Admin Panel** - Complete content management system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- eAEP / Orgo OAuth credentials (for authentication)
- UploadThing account (for file uploads)
- Playwright Chromium (for PDF export: `npm run playwright:install`)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/scout-toolkit-v2.git
   cd scout-toolkit-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up database and environment (Automated)**
   ```bash
   npm run setup:db
   ```
   
   This will:
   - Create `.env.local` with default configuration
   - Start PostgreSQL container with Docker
   - Run database migrations
   - Seed initial data (SDGs, educational areas, demo activities)

4. **Configure authentication and file upload**
   
   Edit `.env.local` and update these values:
   ```env
   # Get these from the eAEP / Orgo tenant
   ORGO_ISSUER="https://eaep.escoteiros.pt"
   ORGO_CLIENT_ID="your-orgo-client-id"
   ORGO_CLIENT_SECRET="your-orgo-client-secret"
   
   # Get these from uploadthing.com
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Manual Database Setup (Alternative)

If you prefer manual setup:

```bash
# Create environment file
npm run setup:env

# Start database
npm run db:start

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

## 📚 Documentation

- **[Architecture Guide](docs/architecture.md)** - Technical decisions and system design
- **[API Documentation](docs/api.md)** - Complete API reference with OpenAPI/Swagger
- **[Development Planning](docs/planning.md)** - Project roadmap and task breakdown
- **[Deployment Guide](docs/deployment.md)** - Production deployment instructions

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** PostgreSQL, Drizzle ORM, Auth.js
- **Development:** ESLint, Prettier, Vitest, Playwright, OpenAPI/Swagger

## 🧪 Testing

```bash
npm run playwright:install  # Download Chromium for PDF export (this project's Playwright version)
npm run test                # Unit and integration tests
npm run test:e2e            # E2E tests
npm run test:coverage       # Coverage report
```

**Testing Infrastructure:**
- **PostgreSQL-based testing** - All tests use the same database technology as production
- **Test database isolation** - Dedicated test database with automatic cleanup between tests
- **Real database operations** - Integration tests perform actual database queries and mutations
- **Schema consistency** - Test schema matches production schema exactly

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run setup:db` | Complete database setup (Docker + migrations + seed) |
| `npm run setup:env` | Create .env.local with default configuration |
| `npm run db:start` | Start PostgreSQL container |
| `npm run db:stop` | Stop PostgreSQL container |
| `npm run db:reset` | Reset database (delete data and restart) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run playwright:install` | Install this project's Playwright Chromium for PDF export |

## 🌍 Interface Language

- **Portuguese:** Complete interface in Portuguese
- **URL Structure:** Direct routes without locale prefixes
  - `/` - Homepage
  - `/activities` - Activities list
  - `/programs` - Programs list
  - `/admin/*` - Admin area

## 🔐 Authentication

- Google OAuth with `@escoteiros.pt` domain restriction
- User and Admin roles with database storage

## 🚀 Deployment

Designed for Vercel deployment with Neon PostgreSQL and UploadThing. See [Deployment Guide](docs/deployment.md) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Portuguese Scout community**
