# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the frontend code in this repository.

## Project Overview

This is the React frontend for a note organization application with recipe creation functionality. The backend API handles note management, authentication, and async recipe processing from URLs.

**Tech Stack:**

- React 18 + TypeScript
- Vite for development and building
- Chakra UI for components
- React Router for navigation
- ky for HTTP client
- dayjs for date handling

## Recently Implemented: Recipe Creation System

A complete async recipe creation feature was implemented that allows users to create recipes from URLs.

### Architecture

**API Layer (`src/api/`):**

- `model/recipe.ts`: TypeScript interfaces for Recipe, RecipeJob, and API types
- `recipes.ts`: API client methods for creating recipes and polling job status
- Uses existing `client.ts` (ky) and `utils.ts` (auth headers) patterns

**Components:**

- `pages/Recipe/index.tsx`: Main recipe creation form with real-time job polling
- Uses existing UI components from `components/ui/`

**Routing:**

- Added `/recipes/new` route to `pages/router.tsx`
- Added "New Recipe" navigation item with chef hat icon to `pages/pages.ts`
- Automatically appears in sidebar navigation via `NavMenu` component

### Recipe Creation Flow

1. **User Input**: URL form with validation
2. **API Call**: POST to `/recipes` endpoint returns job ID immediately
3. **Polling**: Frontend polls `/recipes/jobs/{id}` every 2 seconds
4. **Status Updates**: Real-time feedback (Queued → Processing → Completed/Failed)
5. **Success**: Shows recipe preview and link to created note
6. **Reset**: User can create another recipe

### API Integration

**Backend Endpoints Used:**

- `POST /recipes` - Create recipe from URL (returns job ID)
- `GET /recipes/jobs/{id}` - Get job status and results

**Authentication**: Uses existing JWT middleware and auth headers

**Error Handling**: Graceful display of API errors and job failures

### Key Files Added/Modified

**New Files:**

- `src/api/model/recipe.ts` - Recipe type definitions
- `src/api/recipes.ts` - Recipe API client
- `src/pages/Recipe/index.tsx` - Recipe creation page

**Modified Files:**

- `src/api/index.ts` - Export recipe client
- `src/pages/pages.ts` - Add recipe page definition
- `src/pages/router.tsx` - Add recipe route
- `src/shared/Layout/NavMenu/NavMenu.tsx` - Fix React key prop

### Development Notes

**UI Components:**

- No Card component available, used Box with styling instead
- Alert component has different API than standard Chakra UI
- Field component wraps Chakra UI Field with helper text support

**State Management:**

- Local component state with useState/useEffect
- No external state management needed for this feature
- Polling cleanup handled with useEffect cleanup

**Type Safety:**

- Full TypeScript coverage
- Date fields use dayjs for consistency with existing codebase
- API responses properly typed and validated

## Future Enhancements

**Potential Improvements:**

- Recipe list/browse page
- Recipe editing functionality
- Batch recipe import
- Recipe categorization/tagging
- Recipe sharing features
- Offline recipe storage

## Development Commands

```bash
# Frontend development
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm lint         # ESLint with zero warnings policy
pnpm test         # Vitest unit tests
```

## Backend Integration

The frontend expects the backend to be running on `VITE_API_URL` (defaults to http://localhost:8081) with the following endpoints:

- Authentication via JWT tokens with XSRF protection
- Recipe creation: `POST /recipes` with `{url: string}`
- Job polling: `GET /recipes/jobs/{jobId}`

See the backend CLAUDE.md for complete recipe processing pipeline details.
