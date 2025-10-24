---
description: Repository Information Overview
alwaysApply: true
---

# JDR-IA-Narrative Information

## Summary
A Next.js application for role-playing game (JDR) narrative management with AI assistance. The project provides a web interface for creating and managing RPG campaigns, characters, and sessions with memory management capabilities.

## Structure
- **app/**: Main application code with Next.js App Router structure
  - **api/**: Backend API endpoints for chat, sessions, and authentication
  - **components/**: React components for UI elements
  - **utils/**: Utility functions including memory management
- **prisma/**: Database schema and migrations for PostgreSQL
- **public/**: Static assets including images
- **scripts/**: Utility scripts for environment validation

## Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: Node.js compatible with Next.js 15.5.5
**Framework**: Next.js 15.5.5, React 19.1.0
**Build System**: Next.js with Turbopack
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- next: 15.5.5
- react: 19.1.0
- react-dom: 19.1.0
- axios: 1.12.2
- bcryptjs: 2.4.3

**Development Dependencies**:
- @prisma/client: 6.18.0
- prisma: 6.18.0
- eslint: 9.x
- tailwindcss: 4.x

## Database
**Type**: PostgreSQL (via Supabase)
**ORM**: Prisma 6.18.0
**Schema**: User, Session, Chat, PINLog, AuthToken models
**Connection**: Environment variable `DATABASE_URL`

## Build & Installation
```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Verify environment variables
npm run check-env

# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start
```

## Environment Variables
**Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: API key for OpenAI services
- `USER_KEY`: Unique user identifier

## Testing
**Test File**: test-memory-manager.mjs
**Run Command**:
```bash
node test-memory-manager.mjs
```

## Key Features
**Memory Management**: Sophisticated system for tracking game elements
**Session Management**: Multi-device synchronization of game sessions
**Authentication**: PIN-based login system with token authentication
**AI Integration**: OpenAI API integration for narrative assistance