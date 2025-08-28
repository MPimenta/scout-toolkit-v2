# Scout Activities Platform 🏕️

A modern web platform for scout leaders to browse activities, build programs, and manage content. Built with Next.js 15, TypeScript, and PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

## ✨ Features

- **🎯 Activity Browsing** - Search and filter activities by various criteria
- **📋 Program Builder** - Create and manage event schedules with drag & drop
- **🌍 Internationalization** - Full support for Portuguese (PT) and English (EN)
- **📊 Export Functionality** - Export programs to Excel and PDF
- **⭐ Rating System** - Rate and comment on activities
- **👥 Public Programs** - Share and discover program templates
- **🔐 Secure Authentication** - Google OAuth with domain restriction
- **👨‍💼 Admin Panel** - Complete content management system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- Google OAuth credentials

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/scout_toolkit"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   UPLOADTHING_SECRET="your-uploadthing-secret"
   UPLOADTHING_APP_ID="your-uploadthing-app-id"
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:coverage # Coverage report
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed database with initial data |

## 🌍 Internationalization

- **Portuguese (default):** `/pt/activities`
- **English:** `/en/activities`

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

**Built with ❤️ for the Scout community**
