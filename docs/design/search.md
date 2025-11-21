# Search Feature Design

## Implementation Status

- **Backend**: ✅ Complete (migration, repository, API, tests)
- **Frontend**: ✅ Complete (API client, UI components, integration, UX improvements)
- **Testing**: ✅ Backend unit tests complete, ⏳ Frontend tests pending
- **Branches**: `feature/full-text-search` (backend), `feature/search-ui` (frontend), `feature/list-notes-pagination` (backend enhancement)

## Overview

Implement full-text search across notes using PostgreSQL's native text search capabilities. Search will include note titles, content, and associated tags, with results ranked by relevance.

**Search UX**: Global search bar in navigation header (desktop: right side of header, mobile: in hamburger menu) with context-aware navigation:
- **On Browse page**: Debounced auto-search (300ms) updates results as you type
- **On other pages**: Press Enter to navigate to Browse page with search query
- **Empty search**: Displays all notes with pagination (50 results per page)

## Requirements

### Core Functionality
- Search across note titles and content
- Include tag names in search (e.g., searching "quick" should match notes tagged with "quick-meals")
- Rank results by relevance
- Support pagination
- Scope search to authenticated user's notes only

### Non-Functional Requirements
- Fast search response times (leverage existing GIN index on `notes.tsv`)
- Keep search logic in application code, not database triggers
- Maintain data consistency when tags are added/removed

## Technical Approach

### PostgreSQL Full-Text Search

We use PostgreSQL's `tsvector` and `tsquery` types for full-text search:

- **tsvector**: Optimized representation of document for text search
- **tsquery**: Represents a text query
- **GIN index**: Already exists on `notes.tsv` for fast lookups
- **ts_rank()**: Ranks results by relevance

### TSV Calculation Strategy

The `tsv` (text search vector) field combines:
1. **Title** - Weight 'A' (highest priority)
2. **Content** - Weight 'B' (medium priority)
3. **Tag names** - Weight 'A' (high priority, same as title)

**Calculation Formula:**
```sql
setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
setweight(to_tsvector('english', coalesce(tag_names_joined, '')), 'A')
```

Where `tag_names_joined` is all tag names for the note joined with spaces.

### When TSV is Updated

TSV must be recalculated whenever note content or tags change:

1. **Note creation/update** - `NoteRepository.Upsert()`
2. **Tags assigned** - `NoteRepository.AssignTagsToNote()`
3. **Tag removed** - `NoteRepository.RemoveTagFromNote()`

### Search Query

```sql
SELECT id, user_id, title, content, created_at, updated_at, published_at, published,
       ts_rank(tsv, plainto_tsquery('english', $query)) as rank
FROM notes
WHERE user_id = $user_id
  AND tsv @@ plainto_tsquery('english', $query)
ORDER BY rank DESC, updated_at DESC
LIMIT $limit OFFSET $offset
```

**Query Explanation:**
- `plainto_tsquery()` - Converts plain text query to tsquery (handles spaces, stemming)
- `@@` operator - Matches tsvector against tsquery
- `ts_rank()` - Calculates relevance score
- Order by rank (most relevant first), then by update time

## Key Decisions

### Decision 1: No Database Triggers

**Options Considered:**
- **A) Database triggers** - Automatically update `tsv` on INSERT/UPDATE
- **B) Application code** - Explicitly update `tsv` in Go code

**Decision: Application Code (Option B)**

**Rationale:**
- **Visibility**: Logic is visible in the codebase, not hidden in database
- **Maintainability**: Easier to debug and understand for developers
- **Testability**: Can test TSV calculation in Go unit tests
- **Control**: Explicit control over when TSV is recalculated
- **Simplicity**: Reduces "magic" in the system

**Trade-offs:**
- ❌ Must remember to update TSV in all relevant code paths
- ❌ Slight performance overhead (extra UPDATE query for tag operations)
- ✅ But: Logic is clear and maintainable
- ✅ Performance impact is minimal (tags don't change frequently)

### Decision 2: Include Tags in TSV

**Rationale:**
- Users expect searching "foo" to match notes tagged with "foo"
- Tags are metadata that describe note content
- Searching tags separately would complicate UI/UX
- Tags get high weight (A) like titles for good ranking

**Implementation:**
- Join tag names with spaces when calculating TSV
- Recalculate TSV whenever tags change
- Use transaction to ensure consistency

### Decision 3: English Language for Text Search

**Current Decision: Use 'english' language**

**Rationale:**
- Application is currently English-only
- English stemming improves search (e.g., "running" matches "run")
- Can be made configurable later if needed

**Future Enhancement:**
- Add user preference for language
- Support multi-language search
- Use 'simple' dictionary for language-agnostic search

### Decision 4: Global Navigation Search

**Options Considered:**
- **A) Search only on Browse page** - Search bar/filter on the notes list page
- **B) Global navigation search** - Search bar in app header, available everywhere

**Decision: Global Navigation Search (Option B)**

**Rationale:**
- **Accessibility**: Search available from any page in the app
- **UX Standard**: Common pattern in modern apps (Gmail, Notion, Slack)
- **Desktop**: Search bar placed between logo and theme toggle in header
- **Mobile**: Search input in hamburger menu drawer
- **Navigation Pattern**: Search redirects to Browse page with query parameter

**Implementation:**
- Search bar in `Layout` component header (responsive)
- Debounced auto-search (300ms) to reduce API calls
- Navigate to `/notes/browse?q={query}` on search
- Browse page reads query param and displays results
- Empty query shows prompt to enter search

**Trade-offs:**
- ✅ Better discoverability - users know search exists
- ✅ Faster access - no need to navigate to Browse first
- ✅ Cleaner Browse page - not cluttered with search UI
- ❌ Slight added complexity in routing/navigation
- ❌ Must handle query params in Browse page

### Decision 5: Context-Aware Search Navigation

**Problem:** Initial implementation auto-navigated to Browse page whenever user typed in search bar, preventing navigation to other pages (e.g., clicking a search result would immediately redirect back to Browse).

**Options Considered:**
- **A) Always auto-navigate** - Simple, but breaks navigation flow
- **B) Context-aware navigation** - Auto-navigate only when on Browse page, require Enter on other pages
- **C) Never auto-navigate** - Always require Enter, but loses convenience on Browse page

**Decision: Context-Aware Navigation (Option B)**

**Rationale:**
- **Best UX**: Balances convenience with usability
- **Browse page**: Auto-search provides instant feedback while filtering
- **Other pages**: Enter key prevents navigation hijacking
- **Use case support**: Can search → click result → read note without interruption

**Implementation:**
- Detect current page using `useLocation().pathname`
- Conditional navigation in SearchInput component
- Debounced auto-navigate only when `pathname === '/notes/browse'`
- `onKeyDown` handler for Enter key on other pages

**Trade-offs:**
- ✅ Prevents aggressive navigation that frustrates users
- ✅ Maintains fast filtering on Browse page
- ✅ Clear mental model: "search bar filters current page OR navigates to Browse"
- ❌ Slightly more complex component logic
- ❌ Different behavior in different contexts (but this is good UX)

### Decision 6: Show All Notes on Empty Search

**Problem:** What should Browse page display when search query is empty?

**Options Considered:**
- **A) Show empty state** - "Enter a search query to find notes"
- **B) Show all notes** - Display full note list with pagination

**Decision: Show All Notes (Option B)**

**Rationale:**
- **Better UX**: Browse page becomes useful even without searching
- **Dual purpose**: Note list view + search filter in one page
- **Discoverability**: Users can see all notes and then filter
- **Backend support**: PostgreSQL query already handles empty string (matches all)

**Implementation:**
- Backend: Remove empty query check, let SQL `WHERE ($query = '' OR tsv @@...)` handle it
- Frontend: Always call search endpoint, remove empty state check
- Order by `updated_at DESC` when no search term (most recent first)
- Maintain pagination support

**Trade-offs:**
- ✅ More useful Browse page
- ✅ Clearer purpose: "Browse all notes, optionally filter"
- ✅ No special cases in code
- ❌ Might be slow with thousands of notes (but pagination helps)
- ❌ Lost "search-only" mental model (but new model is better)

### Decision 7: Use Existing useFetch Hook

**Options Considered:**
- **A) Upgrade to TanStack Query** - Modern data fetching library
- **B) Keep existing useFetch hook** - Simple useState/useEffect pattern

**Decision: Keep useFetch (Option B)**

**Rationale:**
- **Consistency**: App already uses useFetch pattern everywhere
- **Simplicity**: No learning curve or new patterns to introduce
- **Sufficient**: Search doesn't need advanced caching/refetching features
- **Quick Implementation**: Faster to implement with existing patterns

**Trade-offs:**
- ❌ No automatic caching or background refetching
- ❌ No request deduplication
- ✅ But: Simpler codebase, less dependencies
- ✅ Can upgrade to TanStack Query later if needed

## Implementation Plan

### Phase 1: Core Infrastructure ✅ COMPLETED

1. **✅ Migration: V08__add_full_text_search.sql**
   - Backfills TSV for all existing notes
   ```sql
   UPDATE notes
   SET tsv = (
     setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
     setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
     setweight(to_tsvector('english', coalesce((
       SELECT string_agg(t.name, ' ')
       FROM tags t
       JOIN note_tags nt ON t.id = nt.tag_id
       WHERE nt.note_id = notes.id
     ), '')), 'A')
   );
   ```

2. **✅ Update `NoteRepository.Upsert()`**
   - Includes TSV calculation in INSERT/UPDATE query
   - Calculates from title, content, and existing tags
   - **Type casting fix**: Cast `$3::varchar` to resolve PostgreSQL parameter type deduction error

3. **✅ Update `NoteRepository.AssignTagsToNote()`**
   - Recalculates TSV after assigning tags
   - Uses transaction to ensure consistency

4. **✅ Update `NoteRepository.RemoveTagFromNote()`**
   - Recalculates TSV after removing tag
   - Uses transaction to ensure consistency

5. **✅ Add `NoteRepository.SearchNotes()`**
   - Implements search method with ts_rank() relevance ranking
   - Supports pagination (limit/offset)
   - Fetches tags for all results in single query (N+1 prevention)

### Phase 2: API Endpoint ✅ COMPLETED

6. **✅ Add search handler (`pkg/handlers/note_handler.go`)**
   - `GET /notes/search?q={query}&limit={limit}&offset={offset}`
   - Validates query parameter (returns empty array if missing)
   - Supports pagination with defaults (limit: 50, max: 100, offset: 0)
   - Returns notes with tags

7. **✅ Add route in Chi router (`pkg/server/server.go`)**
   - Wired up `/notes/search` with authentication middleware
   - Placed before `/{id}` route to prevent path conflicts

8. **✅ Add unit tests (`pkg/handlers/note_handler_test.go`)**
   - Created `NoteRepositoryInterface` for dependency injection
   - Mock repository implementation for testing
   - Test coverage: empty queries, pagination, error handling, auth validation

### Phase 3: Frontend ✅ COMPLETED

9. **✅ Add debounce hook**
   - Created `src/utils/hooks/useDebounce.ts`
   - Generic hook with 300ms delay
   - Reduces API calls during typing
   - Exported through `src/utils/hooks/index.ts` following project patterns

10. **✅ Add search API client method**
    - Updated `src/api/notes.ts` with `search()` method
    - Calls `GET /notes/search?q={query}&limit={limit}&offset={offset}`
    - Returns typed `Note[]` with date parsing
    - Supports empty queries (returns all notes)

11. **✅ Create SearchInput component**
    - New component: `src/components/SearchInput/SearchInput.tsx`
    - Input with magnifying glass icon using Chakra UI InputGroup
    - Debounced input (uses useDebounce hook)
    - **Context-aware navigation**:
      - Auto-navigates on typing when on Browse page (debounced)
      - Requires Enter key press when on other pages
    - Syncs with URL query parameter
    - Exported through `src/components/SearchInput/index.ts`

12. **✅ Update Layout component**
    - File: `src/shared/Layout/Layout.tsx`
    - **Desktop**: SearchInput on right side of header next to theme toggle
      - Use `hideBelow="md"` to hide on small screens
      - Fixed width (250px) for consistent sizing
      - Aligned with ColorModeButton and Avatar
    - **Mobile**: SearchInput at top of hamburger menu DrawerBody
      - Full-width styling
      - Placed before NavMenu

13. **✅ Update Browse page for search results**
    - File: `src/pages/Browse/index.tsx`
    - Read `?q=` query parameter from URL
    - Always fetch from search endpoint (empty query returns all notes)
    - Add "Load More" button for pagination (50 results per page)
    - Track offset state for loading more results
    - Loading state: show skeleton cards
    - Empty states:
      - No notes at all: "You don't have any notes yet"
      - No search results: "No notes match [query]"
    - Accumulates results as user pages through (prevents duplicates)

### Phase 4: UX Improvements ✅ COMPLETED

14. **✅ Support empty search queries (Backend)**
    - Branch: `feature/list-notes-pagination`
    - Updated `SearchNotes` handler to return all notes when query is empty
    - Repository already supported this via SQL condition `($2 = '' OR tsv @@ ...)`
    - Updated unit tests to verify empty query behavior
    - Orders results by `updated_at DESC` when no search term

15. **✅ Context-aware search navigation**
    - Prevents aggressive auto-navigation that hijacks page transitions
    - Uses `useLocation` to detect current page
    - Auto-search only on Browse page (debounced)
    - Enter key required on other pages
    - Allows users to search, click note, and view without redirect

16. **✅ Search bar positioning**
    - Moved from center to right side of header
    - Better visual balance with theme toggle and avatar
    - Maintains mobile drawer placement

## Implementation Details

### Code Locations

**Backend:**
- **Migration**: `db/V08__add_full_text_search.sql`
- **Repository**: `org-go/pkg/db/repositories/notes.go` (Upsert, AssignTagsToNote, RemoveTagFromNote, SearchNotes)
- **Repository Interface**: `org-go/pkg/db/repositories/interfaces.go`
- **Handler**: `org-go/pkg/handlers/note_handler.go` (SearchNotes handler)
- **Handler Tests**: `org-go/pkg/handlers/note_handler_test.go`
- **Router**: `org-go/pkg/server/server.go` (route registration)

**Frontend:**
- **API Client**: `org-frontend/src/api/notes.ts` (search method)
- **Debounce Hook**: `org-frontend/src/utils/hooks/useDebounce.ts`
- **SearchInput Component**: `org-frontend/src/components/SearchInput/SearchInput.tsx`
- **Layout**: `org-frontend/src/shared/Layout/Layout.tsx` (navigation integration)
- **Browse Page**: `org-frontend/src/pages/Browse/index.tsx` (search results display)
- **useFetch Hook**: `org-frontend/src/utils/http/use-fetch.ts` (existing hook)

### Testing Strategy

**Backend (Implemented):**
- ✅ Unit tests for SearchNotes handler with mock repository
- ✅ Test cases: empty queries, pagination, invalid parameters, error handling
- ✅ Test authentication validation
- ✅ Mock repository interface pattern for testability
- ⏳ Future: Integration tests with actual database (optional)

**Frontend (To Be Implemented):**
- Test search input debouncing
- Test navigation to Browse page with query param
- Test result display with various states (loading, empty, results)
- Test pagination (Load More button)
- Test mobile vs desktop layout rendering

## Future Enhancements

### Short Term
- Add search to browse page with filter UI
- Highlight matching terms in results
- Add "Did you mean?" suggestions for typos
- Add search history/recent searches

### Medium Term
- Advanced filters (date range, notebook, published status)
- Search within specific notebook
- Tag filtering in addition to text search
- Sort options (relevance, date, title)

### Long Term
- Search recipes by name/ingredients (separate endpoint)
- Fuzzy search for typo tolerance
- Search suggestions/autocomplete
- Multi-language support
- Search analytics (popular queries)
- Saved searches

## Performance Considerations

### Current Approach
- GIN index on `tsv` already exists (created in V02 migration)
- Search queries should be fast (<100ms for most queries)
- TSV calculation happens on write, not read (good trade-off)

### Monitoring
- Track search query performance
- Monitor TSV recalculation impact on tag operations
- Watch for slow queries as dataset grows

### Optimization Options (if needed)
- Add `ts_rank_cd()` for cover density ranking
- Tune GIN index parameters
- Add caching layer for popular queries
- Consider materialized view for complex searches

## Questions & Answers

### Answered
- ✅ **How many results per page?** → 50 per page with Load More button (offset-based pagination)
- ✅ **Where should search be located?** → Global navigation (right side of header on desktop, mobile hamburger menu)
- ✅ **Should search happen automatically?** → Context-aware: auto-search on Browse page (debounced 300ms), Enter key on other pages
- ✅ **What happens with empty search?** → **CHANGED**: Show all notes with pagination (originally: show prompt)
  - **Reason**: Better UX - Browse page becomes note list view with optional search filtering
  - Backend returns all notes ordered by `updated_at DESC` when query is empty
- ✅ **Which data fetching approach?** → Use existing useFetch hook (not TanStack Query)
- ✅ **Should search be case-sensitive?** → No, using plainto_tsquery for case-insensitive search
- ✅ **Should search auto-navigate from all pages?** → **NO** - Only auto-navigate when already on Browse page to prevent navigation hijacking

### Open / Future Considerations
- Should we support advanced query syntax (AND, OR, NOT)? (Currently: no, just plain text)
- Should we show search relevance score to users? (Probably not needed for MVP)
- Should we add search history/recent searches? (Nice to have)
- Should we highlight matching terms in results? (Enhancement)
- Should we add "Did you mean?" suggestions? (Enhancement)

## References

- [PostgreSQL Full-Text Search Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL ts_rank Documentation](https://www.postgresql.org/docs/current/textsearch-controls.html#TEXTSEARCH-RANKING)
- Existing index: `db/V02__articles.sql:14` - `CREATE INDEX idx_articles_tsv ON articles USING gin(tsv);`
