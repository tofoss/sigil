# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a full-stack note organization application with a Go backend and React frontend:

- **Backend (sigil-go/)**: Go server using Chi router, PostgreSQL with pgx, JWT authentication
- **Frontend (sigil-frontend/)**: React 18 + TypeScript, Vite, Chakra UI, TanStack Query
- **Database**: PostgreSQL with versioned migrations in `db/`
- **Package Manager**: pnpm for frontend, Go modules for backend

## Development Commands

### Initial Setup
```bash
# Generate security secrets (run once)
./setup.sh

# Load the environment variables into the shell
export $(grep -v '^#' .env | xargs)

# Start database
docker-compose up -d

# Install frontend dependencies
cd sigil-frontend && pnpm install
```

### Frontend Development (sigil-frontend/)
```bash
# Development server
pnpm dev

# Build and linting
pnpm build      # TypeScript compilation + Vite build
pnpm lint       # ESLint with zero warnings policy

# Testing
pnpm test       # Vitest unit tests
pnpm test:ci    # CI-friendly test run with JUnit output

# Storybook
pnpm storybook  # Component development environment
pnpm test-storybook  # Storybook component tests
```

### Backend Development (sigil-go/)
```bash
# Development server
go run cmd/server/main.go

# Build and test
go build cmd/server/main.go
go test ./...

# Additional utilities
go run cmd/deepseek/main.go  # AI integration tool
go run cmd/parser/main.go    # HTML parser tool
```

## Key Architecture Patterns

### Backend Structure
- **Repository Pattern**: Data access in `pkg/db/repositories/`
- **Handler Pattern**: HTTP handlers in `pkg/handlers/`
- **Middleware Chain**: Authentication, CORS, and XSRF protection
- **Clean Architecture**: Models, handlers, and repositories separation

### Frontend Structure
- **API Client**: Centralized HTTP client using ky in `src/api/`
- **Page Routing**: Route-based code splitting in `src/pages/`
- **Component Library**: Chakra UI components in `src/components/ui/`
- **State Management**: Zustand + TanStack Query for server state

### Database Schema
Core entities: Users → Notebooks → Sections → Notes, with Tags for cross-cutting organization.

## Development Workflow

1. **Environment**: Backend runs on port 8081, frontend on Vite default port
2. **Database**: PostgreSQL on port 5432 via Docker Compose
3. **Authentication**: JWT tokens with XSRF protection
4. **API Mocking**: MSW (Mock Service Worker) for frontend testing
5. **Code Quality**: ESLint with zero warnings policy, Husky pre-commit hooks

## Documentation Practices

### Design Documents

Before implementing significant features, create a design document in `docs/design/` that captures:
- **What**: Feature overview and requirements
- **Why**: Problem being solved and user needs
- **How**: Technical approach and implementation strategy
- **Key Decisions**: Important choices made and their rationale (especially when choosing between multiple valid approaches)
- **Trade-offs**: Pros and cons of the chosen approach

**Purpose**: Design docs help future developers (including yourself) understand the reasoning behind implementation choices when revisiting code months later.

**Example**: `docs/design/search.md` documents the full-text search implementation, including the decision to handle TSV updates in application code rather than database triggers.

## Environment Variables

All configuration is managed through environment variables. See `.env.example` for a complete template.

### Required Variables
- `JWT_SECRET` - Secret key for JWT token signing (generate with `openssl rand -base64 64`)
- `XSRF_SECRET` - Secret key for XSRF token generation

### Database (PostgreSQL)
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - PostgreSQL connection
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` - Docker Compose database init

### Server Configuration
- `PORT` - Backend server port (default: `8081`)
- `READ_TIMEOUT`, `WRITE_TIMEOUT`, `IDLE_TIMEOUT` - HTTP timeouts (default: `15s`, `15s`, `60s`)
- `SHUTDOWN_TIMEOUT` - Graceful shutdown timeout (default: `30s`)

### Authentication
- `ACCESS_TOKEN_DURATION` - JWT access token validity (default: `15m`)
- `REFRESH_TOKEN_DURATION` - Refresh token validity (default: `168h` / 7 days)
- `COOKIE_SECURE` - Set to `false` for local development without HTTPS (default: `true`)

### CORS & Rate Limiting
- `CORS_ALLOWED_ORIGINS` - Comma-separated allowed origins (default: `http://localhost:5173`)
- `AUTH_RATE_LIMIT` - Max auth requests per window (default: `5`)
- `RATE_LIMIT_WINDOW` - Rate limit window duration (default: `1m`)

### File Storage
- `UPLOAD_PATH` - Directory for uploaded files (default: `~/sigil/uploads`)
- `MAX_FILE_SIZE` - Maximum upload size in bytes (default: `10485760` / 10MB)

### Recipe Processing
- `JOB_POLL_INTERVAL` - Job queue poll frequency (default: `10s`)
- `JOB_BATCH_SIZE` - Jobs to process concurrently (default: `5`)
- `JOB_MAX_RETRIES` - Max retry attempts (default: `3`)
- `JOB_TIMEOUT` - Per-job timeout (default: `5m`)
- `CONTENT_FETCH_TIMEOUT` - URL fetch timeout (default: `30s`)
- `AI_PROCESSING_TIMEOUT` - AI processing timeout (default: `180s`)

### External Services
- `DEEPSEEK_API_KEY` - API key for DeepSeek AI integration

### Frontend
- `VITE_API_URL` - Backend API URL (default: `http://localhost:8081`)

## Testing Strategy

- **Frontend**: Vitest for unit tests, Storybook for component testing, MSW for API mocking
- **Backend**: Standard Go testing framework
- **Integration**: Playwright for end-to-end testing

## Special Features

- **Recipe Support**: Specialized note type with structured ingredients/steps
- **AI Integration**: DeepSeek integration for content enhancement
- **Markdown Support**: React Markdown with syntax highlighting
- **Hierarchical Organization**: Three-level structure (Notebooks → Sections → Notes)
