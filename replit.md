# CyberGuard - Victim Assistance System

## Overview

CyberGuard is a comprehensive victim assistance system for cybercrime incidents. It provides:

- **Telegram Bot**: Conversational interface for victims to register cases in Spanish
- **Admin Dashboard**: Real-time web interface for case management and monitoring
- **RESTful API**: Backend services built with Express.js
- **PostgreSQL Database**: Persistent storage for users, cases, evidences, and reported numbers

The system helps victims of phishing, WhatsApp hacking, email hacking, extortion, and other digital crimes report incidents and receive assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack Query for server state
- **UI Components**: shadcn/ui with Radix primitives
- **Styling**: Tailwind CSS with custom cybersecurity dark theme
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion

The frontend is a single-page application with pages for Dashboard, Cases, Case Details, and Reports. All API calls go through a centralized query client with consistent error handling.

### Backend (Express.js)
- **Runtime**: Node.js with TypeScript (tsx)
- **Framework**: Express 5
- **API Pattern**: RESTful endpoints under `/api/*`
- **Bot Integration**: Telegraf for Telegram bot with scene-based conversation flow

Routes are defined in `shared/routes.ts` using Zod schemas for type-safe API contracts shared between frontend and backend.

### Database (PostgreSQL + Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: `drizzle-kit push` for schema sync

Key tables:
- `users` - Victim/admin profiles with Telegram integration
- `cases` - Incident reports with type, status, financial data
- `evidences` - File attachments linked to cases
- `messages` - Internal chat between admin and victims
- `reportedNumbers` - Fraud database of suspicious phone numbers
- `botInteractions` - Telegram conversation logs

### Build System
- **Dev Server**: Vite with HMR for frontend, tsx for backend
- **Production Build**: esbuild bundles server, Vite builds client
- **Output**: `dist/` directory with `index.cjs` and `public/` assets

## External Dependencies

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable
- **Session Storage**: `connect-pg-simple` for Express sessions

### Third-Party Services
- **Telegram Bot API**: Requires `TELEGRAM_BOT_TOKEN` environment variable
- Bot uses Telegraf library with scene-based conversation flows

### Key NPM Packages
- `drizzle-orm` / `drizzle-zod` - Database ORM and schema validation
- `telegraf` - Telegram bot framework
- `@tanstack/react-query` - Data fetching and caching
- `recharts` - Dashboard charts
- `framer-motion` - UI animations
- `date-fns` - Date formatting
- `zod` - Runtime type validation