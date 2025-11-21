# Technical Debt Analysis

Generated: 2025-11-19


## MEDIUM Severity Issues

### 9. Missing GIN Index for Full-Text Search
**File**: `db/V08__add_full_text_search.sql`

No index created for TSV column - full table scans on search.

### 10. No SSRF Protection on Recipe URLs
**File**: `sigil-go/pkg/services/recipe_processor.go:116-142`

URLs passed without validation for schemes or private IP ranges.

### 11. Console.log in Production Code
**File**: `sigil-frontend/src/modules/editor/Editor.tsx:1,151,186,222-223`

Debug logs with eslint rule disabled.

### 12. Unused Dead Code
**File**: `sigil-go/pkg/db/db.go:32-45`

Functions `mustAtoi` and `getEnv` are never called.

### 13. N+1 Query in FetchNoteWithTags
**File**: `sigil-go/pkg/db/repositories/notes.go:372-388`

Two separate queries when one JOIN would suffice.

### 14. Missing Memoization
**File**: `sigil-frontend/src/shared/Layout/NotebookTree/NotebookTree.tsx:87-141`

Tree transformation runs on every render without useMemo.

### 15. Poor ErrorBoundary UX
**File**: `sigil-frontend/src/pages/Note/index.tsx:124-126`

Returns only `<p>500</p>` - no error details or recovery options.

---

## LOW Severity Issues

### 16. Inconsistent Logging Patterns
Multiple handlers - some log errors, others don't. No structured logging.

### 17. Low Test Coverage
Only 2 handler test files found. Missing tests for most handlers, repositories, and services.

### 18. Test Mocks Use Panic
**File**: `sigil-go/pkg/handlers/note_handler_test.go`

Mock methods panic instead of returning proper errors.

### 19. Hardcoded Autosave Interval
**File**: `sigil-frontend/src/modules/editor/Editor.tsx:58`

Should be configurable.

### 20. Component Naming Convention
**File**: `sigil-frontend/src/pages/Note/index.tsx:21`

`notePage` should be `NotePage` (PascalCase).

### 21. Unused Import
**File**: `sigil-frontend/src/pages/Browse/index.tsx:14`

`EmptyNoteList` imported but never used.

---

## Architecture Recommendations

### Backend
- Create interfaces for all repositories and use dependency injection
- Move TreeHandler queries to proper repository
- Add structured logging with correlation IDs
- Implement proper error types instead of panics

### Frontend
- Add memoization for expensive tree transformations
- Implement proper error boundaries with retry logic
- Add accessibility testing

### Testing
- Achieve >80% code coverage on backend
- Add integration tests for API endpoints
- Add E2E tests with Playwright
