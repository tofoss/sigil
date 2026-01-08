# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Full-stack note organization app: Go backend (Chi router, PostgreSQL) + React frontend (Vite, Chakra UI, TypeScript).

## Build/Lint/Test Commands

### Frontend (sigil-frontend/)

```bash
pnpm dev           # Development server
pnpm build         # TypeScript + Vite build
pnpm lint          # ESLint (zero warnings policy)
pnpm test          # Vitest unit tests
pnpm test:ci       # CI test run with JUnit output
pnpm storybook     # Component development
```

**Run single test:**
```bash
pnpm test src/path/to/file.test.ts           # Specific file
pnpm test -t "should render correctly"       # Match test name
pnpm test src/pages/NotePage.test.tsx -t "should fetch"  # File + name
```

### Backend (sigil-go/)

```bash
go run cmd/server/main.go    # Development server
go build cmd/server/main.go  # Build binary
go test ./...                # All tests
```

**Run single test:**
```bash
go test -v ./pkg/handlers/ -run TestSearchNotes           # Specific function
go test -v ./pkg/handlers/note_handler_test.go            # Specific file
go test -v ./pkg/utils/ -run TestGenerateTitleFromContent # Package + function
```

## Code Style Guidelines

### TypeScript/React (Frontend)

**Formatting (Prettier):**
- 2-space indentation
- No semicolons
- Double quotes
- Trailing commas in ES5 contexts

**ESLint Rules:**
- `@typescript-eslint/no-explicit-any`: error (use proper types)
- `no-console`: warn (only `console.warn`, `console.error`, `console.info` allowed)
- Restricted imports: use `lodash-es` not `lodash`, use wrapped `dayjs` and `react-router-dom`

**Import Order:**
```typescript
// 1. External libraries
import { Box, Button } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"

// 2. Internal absolute imports (use path aliases)
import { noteClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useParams } from "shared/Router"
import { useFetch } from "utils/http"
```

**Path Aliases:** Use `@/*` or baseUrl imports, not relative paths like `../../`.

**Component Patterns:**
```typescript
// Named export with Component alias for lazy loading
export const NotePage = () => { ... }
export { NotePage as Component }

// Functional components with hooks only
// ErrorBoundary co-located with pages
```

**Naming Conventions:**
- Components: PascalCase (`NotePage`, `SearchInput`)
- Hooks: camelCase with `use` prefix (`useDebounce`, `useFetch`)
- Utility files: kebab-case (`use-fetch.ts`)
- Use index files for barrel exports

**Error Handling:**
```typescript
try {
  await noteClient.delete(id)
  toaster.create({ title: "Note deleted", type: "success" })
} catch (err) {
  console.error("Failed to delete note:", err)
  toaster.create({ title: "Error", description: "Please try again", type: "error" })
}
```

### Go (Backend)

**Import Order:**
```go
import (
    // Standard library
    "context"
    "encoding/json"
    "net/http"

    // Internal packages
    "tofoss/sigil-go/pkg/db/repositories"
    "tofoss/sigil-go/pkg/handlers/errors"
    "tofoss/sigil-go/pkg/models"

    // External packages
    "github.com/go-chi/chi/v5"
    "github.com/google/uuid"
)
```

**Struct Tags:** Always include both `json` and `db` tags:
```go
type Note struct {
    ID        uuid.UUID  `json:"id"        db:"id"`
    UserID    uuid.UUID  `json:"userId"    db:"user_id"`
    CreatedAt time.Time  `json:"createdAt" db:"created_at"`
}
```

**Handler Pattern:**
```go
func (h *NoteHandler) FetchNote(w http.ResponseWriter, r *http.Request) {
    userID, _, err := utils.UserContext(r)
    if err != nil {
        log.Printf("error getting user context: %v", err)
        errors.InternalServerError(w)
        return
    }
    // ... business logic
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(response)
}
```

**Repository Pattern:**
- Interfaces in `pkg/db/repositories/interfaces.go`
- Constructor: `func NewXxxRepository(pool *pgxpool.Pool) *XxxRepository`
- First parameter always `context.Context`

**Error Handling:**
- Log errors before returning: `log.Printf("error: %v", err)`
- Use error helpers: `errors.BadRequest(w)`, `errors.NotFound(w, msg)`, `errors.InternalServerError(w)`
- Return early on errors

**Testing Pattern:**
```go
func TestSearchNotes(t *testing.T) {
    tests := []struct {
        name           string
        input          string
        expectedStatus int
        // ... other fields
    }{
        {
            name:           "Valid input",
            input:          "test",
            expectedStatus: http.StatusOK,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // ... test implementation
        })
    }
}
```

## Architecture Patterns

- **Repository Pattern:** All DB access through `pkg/db/repositories/`
- **Handler Pattern:** Thin HTTP handlers in `pkg/handlers/`, delegate to repositories
- **Zustand Stores:** Global state in `src/stores/`
- **API Client:** Centralized ky-based client in `src/api/`
- **Design Documents:** Create `docs/design/feature.md` for significant features

## Key Directories

```
sigil-frontend/src/
  api/          # HTTP client and API models
  components/   # Reusable UI components (Chakra UI)
  modules/      # Feature modules (editor, markdown)
  pages/        # Route-based pages
  stores/       # Zustand state management
  utils/        # Hooks and utilities

sigil-go/pkg/
  handlers/     # HTTP handlers + errors/, requests/, responses/
  db/repositories/  # Data access layer
  models/       # Domain structs
  middleware/   # JWT, CORS, XSRF
  services/     # Business logic
```

## Common Gotchas

1. **Zero warnings policy:** `pnpm lint` must pass with no warnings
2. **Restricted imports:** Don't import `react-router-dom` or `dayjs` directly; use wrapped versions
3. **No `any` types:** Use proper TypeScript types
4. **Context first:** Go repository methods always take `context.Context` as first param
5. **JSON camelCase, DB snake_case:** Use both struct tags in Go models
