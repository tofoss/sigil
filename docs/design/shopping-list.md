# Shopping List Feature - Design Document

## What

Add shopping list mode to notes, enabling users to create and manage shopping lists with intelligent autocomplete, recipe ingredient merging, and structured data extraction from markdown checkboxes.

## Why

**Problem Being Solved:**
Users want to manage shopping lists within the note-taking app, leveraging existing recipe data and providing a better experience than plain markdown checklists.

**User Needs:**
- Quick shopping list creation without leaving the app
- Smart autocomplete based on shopping history and recipes
- Easy recipe-to-shopping-list conversion
- Structured data for potential mobile app integration
- Maintain markdown as source of truth (no lock-in)

## How

### Architecture Overview

Shopping lists are **regular notes with enhanced capabilities** (not a separate entity):
- User toggles "shopping list mode" on any note
- Backend parses markdown checkboxes into structured data
- Structured data powers autocomplete and recipe integration
- Markdown remains source of truth, database is derived cache

### Core Technical Approach

1. **Mode Detection**: Presence in `shopping_lists` table = mode enabled
2. **Parsing**: Extract checkboxes on every save with content-hash caching
3. **Autocomplete**: Three sources - user history, recipe ingredients, common groceries
4. **Recipe Integration**: Merge ingredients with quantity summing (same units only for MVP)
5. **Editor Extensions**: CodeMirror auto-checkbox on Enter, live autocomplete

---

## Database Schema

### Three New Tables

**1. shopping_lists** - Main entity (1:1 with note)
```sql
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    note_id UUID NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL,  -- SHA-256 for cache invalidation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_shopping_lists_note_id ON shopping_lists(note_id);
CREATE INDEX idx_shopping_lists_content_hash ON shopping_lists(content_hash);
```

**2. shopping_list_items** - Individual items (1:many with shopping_list)
```sql
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,           -- normalized: "carrots"
    display_name TEXT NOT NULL,        -- original: "Carrots (organic)"
    quantity_min DOUBLE PRECISION,
    quantity_max DOUBLE PRECISION,
    quantity_unit TEXT,
    notes TEXT,                        -- parenthetical notes, links
    checked BOOLEAN DEFAULT FALSE,
    position INTEGER NOT NULL,         -- preserve markdown order
    section_header TEXT,               -- e.g., "Groceries"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_list_items_shopping_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_item_name ON shopping_list_items(item_name);
CREATE INDEX idx_shopping_list_items_position ON shopping_list_items(shopping_list_id, position);
```

**3. shopping_item_vocabulary** - Autocomplete source (user + global)
```sql
CREATE TABLE shopping_item_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = global
    item_name TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,       -- usage count for ranking
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_vocabulary_user_item ON shopping_item_vocabulary(user_id, item_name);
CREATE INDEX idx_vocabulary_item_name ON shopping_item_vocabulary(item_name);
CREATE INDEX idx_vocabulary_frequency ON shopping_item_vocabulary(frequency DESC);
```

**Seed ~200 common groceries** in migration V14:
```sql
INSERT INTO shopping_item_vocabulary (user_id, item_name, frequency) VALUES
(NULL, 'milk', 100),
(NULL, 'eggs', 100),
(NULL, 'bread', 100),
-- ... ~200 items
ON CONFLICT DO NOTHING;
```

---

## Backend Implementation

### Models (`sigil-go/pkg/models/shopping_list.go`)

```go
type ShoppingList struct {
    ID              uuid.UUID           `json:"id" db:"id"`
    NoteID          uuid.UUID           `json:"noteId" db:"note_id"`
    UserID          uuid.UUID           `json:"userId" db:"user_id"`
    ContentHash     string              `json:"contentHash" db:"content_hash"`
    Items           []ShoppingListEntry `json:"items" db:"-"`
    CreatedAt       time.Time           `json:"createdAt" db:"created_at"`
    UpdatedAt       time.Time           `json:"updatedAt" db:"updated_at"`
}

type ShoppingListEntry struct {
    ID             uuid.UUID  `json:"id" db:"id"`
    ShoppingListID uuid.UUID  `json:"shoppingListId" db:"shopping_list_id"`
    ItemName       string     `json:"itemName" db:"item_name"`       // "carrots"
    DisplayName    string     `json:"displayName" db:"display_name"` // "Carrots (organic)"
    Quantity       *Quantity  `json:"quantity" db:"-"`               // Reuse from recipes
    Notes          string     `json:"notes" db:"notes"`
    Checked        bool       `json:"checked" db:"checked"`
    Position       int        `json:"position" db:"position"`
    SectionHeader  string     `json:"sectionHeader" db:"section_header"`
    CreatedAt      time.Time  `json:"createdAt" db:"created_at"`
}

type VocabularyItem struct {
    ID        uuid.UUID  `json:"id" db:"id"`
    UserID    *uuid.UUID `json:"userId" db:"user_id"`
    ItemName  string     `json:"itemName" db:"item_name"`
    Frequency int        `json:"frequency" db:"frequency"`
    LastUsed  time.Time  `json:"lastUsed" db:"last_used"`
}

// Reuse from recipes
type Quantity struct {
    Min  *float64 `json:"min"`
    Max  *float64 `json:"max"`
    Unit string   `json:"unit"`
}
```

### Parser (`sigil-go/pkg/utils/shopping_list_parser.go`)

**Parsing logic:**
- Regex: `^\s*-\s*\[([ xX])\]\s*(.+)$`
- Extract quantity: `"1kg Carrots"` → `{min: 1, unit: "kg"}`, `"carrots"`
- Normalize: `strings.ToLower(strings.TrimSpace(name))`
- Track section headers: `## Groceries`
- Extract notes: parenthetical text, markdown links

**Quantity patterns:**
- `"1kg"` → min=1, max=1, unit="kg"
- `"2-3 cups"` → min=2, max=3, unit="cups"
- `"at least 1L"` → min=1, max=nil, unit="L"

### Repository (`sigil-go/pkg/db/repositories/shopping_list.go`)

**Key methods:**
```go
// Parse note content and update shopping list (with caching)
UpsertFromNote(ctx, noteID, userID, content) (*ShoppingList, error) {
    newHash := sha256(content)
    existing, _ := GetByNoteID(ctx, noteID)
    if existing != nil && existing.ContentHash == newHash {
        return existing, nil  // Skip re-parsing
    }
    items := ParseShoppingList(content)
    // Save to database, update vocabulary
}

GetByNoteID(ctx, noteID) (*ShoppingList, error)
UpdateItemCheckStatus(ctx, itemID, checked) error
GetUserVocabulary(ctx, userID, prefix, limit) ([]VocabularyItem, error)
AddToVocabulary(ctx, userID, itemName) error
```

### Handler (`sigil-go/pkg/handlers/shopping_list_handler.go`)

**API Endpoints:**
```go
GET    /notes/{id}/shopping-list           // Retrieve parsed shopping list
PUT    /notes/{id}/shopping-list           // Enable shopping list mode
DELETE /notes/{id}/shopping-list           // Disable shopping list mode
PATCH  /shopping-list/items/{id}/check     // Toggle checkbox
GET    /shopping-list/vocabulary?q=car     // Autocomplete suggestions
POST   /shopping-list/{id}/merge-recipe    // Add recipe ingredients
```

**Recipe merge logic:**
1. Fetch recipe ingredients
2. Parse current shopping list
3. For each ingredient:
   - Normalize name
   - If exists AND units match: sum quantities
   - If exists AND units differ: append separate
   - If not exists: append
4. Regenerate markdown
5. Save note + re-parse

### Integration Hook (`sigil-go/pkg/handlers/note_handler.go`)

After note save (lines 220, 262), add:
```go
if h.isShoppingListNote(noteID) {
    _, err := h.shoppingListRepo.UpsertFromNote(ctx, noteID, userID, note.Content)
    if err != nil {
        log.Printf("Failed to update shopping list: %v", err)
        // Don't fail note save - non-critical
    }
}
```

---

## Frontend Implementation

### API Client (`sigil-frontend/src/api/shopping-list.ts`)

```typescript
export const shoppingListClient = {
  get: (noteId: string) =>
    client.get(`notes/${noteId}/shopping-list`).json<ShoppingList>(),

  enable: (noteId: string) =>
    client.put(`notes/${noteId}/shopping-list`).json<ShoppingList>(),

  disable: (noteId: string) =>
    client.delete(`notes/{noteId}/shopping-list`),

  toggleItem: (itemId: string, checked: boolean) =>
    client.patch(`shopping-list/items/${itemId}/check`, { json: { checked } }),

  getVocabulary: (query: string) =>
    client.get(`shopping-list/vocabulary`, { searchParams: { q: query } }).json<VocabularyItem[]>(),

  mergeRecipe: (shoppingListId: string, recipeId: string) =>
    client.post(`shopping-list/${shoppingListId}/merge-recipe`, { json: { recipeId } }).json<ShoppingList>()
}
```

### CodeMirror Extensions (`sigil-frontend/src/modules/editor/extensions/shoppingListExtension.ts`)

**State field:**
```typescript
export const shoppingListMode = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (let effect of tr.effects) {
      if (effect.is(toggleShoppingListMode)) return effect.value
    }
    return value
  }
})
```

**Enter key handler:**
```typescript
export const shoppingListKeymap = keymap.of([{
  key: 'Enter',
  run: (view) => {
    if (!view.state.field(shoppingListMode)) return false
    const line = view.state.doc.lineAt(view.state.selection.main.from)
    if (/^\s*-\s*\[([ xX])\]\s*/.test(line.text)) {
      view.dispatch({ changes: { from: line.to, insert: '\n- [ ] ' } })
      return true
    }
    return false
  }
}])
```

**Autocomplete:**
```typescript
export function shoppingListAutocomplete(fetchVocab: (q: string) => Promise<VocabularyItem[]>) {
  return autocompletion({
    override: [async (context) => {
      // Only on checkbox lines
      // Extract word before cursor
      // Fetch vocabulary suggestions
      // Return completion options
    }]
  })
}
```

### Editor Integration (`sigil-frontend/src/modules/editor/Editor.tsx`)

**Add toggle button:**
```typescript
<Button
  size="sm"
  variant={isShoppingListMode ? "solid" : "ghost"}
  onClick={toggleShoppingListMode}
  aria-label="Shopping list mode"
>
  <LuShoppingCart />
</Button>
```

**Add extensions:**
```typescript
const extensions = useMemo(() => {
  const base = [markdown(), vim(), markdownPasteHandler, fullHeightEditor]

  if (isShoppingListMode) {
    base.push(
      shoppingListMode.init(() => true),
      shoppingListKeymap,
      shoppingListAutocomplete(q => shoppingListClient.getVocabulary(q))
    )
  }

  return base
}, [isShoppingListMode])
```

### Shopping List Panel (`sigil-frontend/src/components/shopping-list/ShoppingListPanel.tsx`)

Structured view with:
- Section grouping
- Real-time checkbox toggling
- Quantity display
- Progress indicator

---

## Key Design Decisions

### 1. Shopping List Detection: Table Presence

**Decision:** Note is in shopping list mode if `shopping_lists.note_id` exists

**Why:**
- Clean separation (no core schema changes)
- Follows recipe pattern (many-to-many via junction)
- Single source of truth

**Alternative rejected:** Boolean flag in notes table (couples concerns)

### 2. Markdown as Source of Truth

**Decision:** Markdown is primary, database is derived cache

**Why:**
- Simple mental model
- No conflict resolution needed
- User edits markdown → autosave → re-parse → DB updates
- UI checkbox toggle → updates markdown + DB

**Alternative rejected:** Database as primary (complicated two-way sync)

### 3. Parse on Save with Content Hash Caching

**Decision:** Synchronous parsing on every save, skip if content hash unchanged

**Why:**
- Shopping list parsing is fast (<50ms for 50 items)
- User expects immediate feedback
- Content hash prevents redundant work
- Much simpler than async job queue

**Performance:**
- 10-second autosave = max 6 parses/minute
- Negligible CPU impact

**Alternative rejected:** Async job queue like recipes (overkill for fast operation)

### 4. Struct Naming: `ShoppingListEntry`

**Decision:** `ShoppingListEntry` instead of user's proposed `Foo`

**Why:**
- Semantic clarity
- Consistent with codebase (`RecipeJob`, `RecipeURLCache`)
- Clearly indicates entry/row in shopping list

### 5. Unit Merging: Exact Match Only (MVP)

**Decision:** Only merge quantities if units match exactly

**Why:**
- Unit conversion requires ingredient-specific densities (1 cup flour ≠ 1 cup water)
- Complex edge cases (metric vs imperial)
- Simple and predictable

**Example:**
- `1kg + 500g` → Merge to `1.5kg`
- `1kg + 2 cups` → Keep separate

**Future enhancement:** Add unit conversion library

### 6. Autocomplete Sources: User + Recipes + Common

**Decision:** Three vocabulary sources:
1. User's shopping history (personalized)
2. Recipe ingredients (leverage existing data)
3. Common groceries (~200 seeded items)

**Why:**
- User history: Learns from usage
- Recipes: Discovers items from saved recipes
- Common list: Helps new users, ensures consistency

**Ranking:** Sort by frequency DESC (global=100, user starts at 1, increments)

### 7. Separate Tables vs JSONB

**Decision:** Use `shopping_list_items` table, not JSONB array in `shopping_lists`

**Why:**
- Efficient querying across all user's shopping lists
- Fast autocomplete (indexed `item_name`)
- Proper normalization (1-to-many)
- Lessons learned from recipe schema evolution (moved from JSONB to proper schema)

---

## Trade-offs

### Trade-off 1: Extra DB Query on Every Save

**Cost:** Shopping list mode detection requires checking `shopping_lists` table on every note save

**Benefit:** Clean separation, no core schema changes

**Mitigation:** Can cache mode state in memory/session if needed

### Trade-off 2: Check State Lost on Item Edit

**Scenario:** User checks "Milk", then edits markdown to "Almond Milk"

**Behavior:** Check state lost (item name changed → new item created)

**Rationale:** Editing content = starting fresh (reasonable expectation)

**Alternative rejected:** Match by position and preserve checks (too complex, many edge cases)

### Trade-off 3: No Unit Conversion (MVP)

**Limitation:** `1kg flour` + `2 cups flour` kept separate

**Benefit:** Simple, predictable, avoids density calculations

**Future:** Add conversion library with ingredient database

### Trade-off 4: Last Write Wins (Concurrent Edits)

**Limitation:** If user toggles checkbox in tab A while editing in tab B, last save wins

**Mitigation:** Checkbox toggle immediately updates editor markdown (reduces race window to <1s)

**Future:** WebSocket real-time sync (out of scope)

---

## Edge Cases Handled

### 1. Multiple Sections in One Note
```markdown
## Groceries
- [ ] Milk

## Hardware
- [ ] Screws
```

**Handling:** Single shopping list with `section_header` field preserving context

### 2. Parsing Failures

**Handling:**
- Log error, don't fail note save
- Keep old parsed data
- Show notification: "Unable to parse shopping list"
- Editor continues working

### 3. Checkbox Toggle Race Condition

**Scenario:** Toggle at T+0s, autosave at T+10s

**Mitigation:**
- Toggle immediately updates markdown (optimistic update)
- Reduces window from 10s to <1s

### 4. Recipe with Incompatible Units

**Handling:** Keep as separate items, user manually merges if needed

### 5. Empty or Malformed Checkboxes

**Handling:** Parser skips invalid lines, continues with valid items

---

## Implementation Sequence

### Phase 1: Backend Foundation (Days 1-2)
- Database migrations (V13, V14)
- Models and parser
- Unit tests

### Phase 2: Backend API (Days 3-4)
- Repository and handler
- Routes and note save integration
- API tests

### Phase 3: Frontend Core (Days 5-6)
- API client and models
- Shopping list mode toggle
- Enable/disable functionality

### Phase 4: Editor Extensions (Days 7-8)
- CodeMirror state field
- Auto-checkbox on Enter
- Live autocomplete

### Phase 5: Structured View (Days 9-10)
- ShoppingListPanel component
- Checkbox toggle UI
- Section grouping

### Phase 6: Recipe Integration (Days 11-12)
- "Add to Shopping List" button
- Shopping list selector
- Quantity merging

### Phase 7: Testing & Polish (Days 13-14)
- Unit and integration tests
- Error handling
- Loading states
- Documentation

**Total: 14 days (2-3 weeks)**

---

## Files to Create/Modify

### Backend - New
- `sigil-go/pkg/models/shopping_list.go`
- `sigil-go/pkg/utils/shopping_list_parser.go`
- `sigil-go/pkg/db/repositories/shopping_list.go`
- `sigil-go/pkg/handlers/shopping_list_handler.go`
- `db/V13__shopping_lists.sql`
- `db/V14__seed_shopping_vocabulary.sql`

### Backend - Modify
- `sigil-go/pkg/handlers/note_handler.go` (lines 220, 262)
- `sigil-go/pkg/server/server.go` (add routes)

### Frontend - New
- `sigil-frontend/src/api/shopping-list.ts`
- `sigil-frontend/src/api/model/shopping-list.ts`
- `sigil-frontend/src/modules/editor/extensions/shoppingListExtension.ts`
- `sigil-frontend/src/components/shopping-list/ShoppingListPanel.tsx`

### Frontend - Modify
- `sigil-frontend/src/modules/editor/Editor.tsx` (toggle button, extensions)
- `sigil-frontend/src/api/index.ts` (export client)

---

## Future Enhancements

### High Priority
- Unit conversion with ingredient densities
- Plural/singular normalization (stemming)
- Recipe ingredient suggestions in autocomplete

### Medium Priority
- Shopping list templates
- Smart sorting by store section
- Share shopping list (read-only URL)

### Low Priority
- Mobile app export (iOS Reminders, etc.)
- Voice input
- Price tracking
- Meal planning integration

---

## Success Metrics

- Users can create shopping lists in <5 seconds
- Autocomplete reduces typing by 50%
- Recipe-to-shopping-list conversion used regularly
- No performance degradation with 100+ item lists
- Zero data loss from parsing failures

---

## Why This Design Works

**Leverages Existing Patterns:**
- Repository pattern (notes, recipes)
- Content hashing (recipe URL cache)
- CodeMirror extensions (image paste handler)
- Upsert pattern (notes)

**Respects User Control:**
- Markdown remains source of truth
- No lock-in to structured format
- Graceful degradation on parse errors

**Optimized for Performance:**
- Content hash caching prevents redundant parsing
- Indexed autocomplete queries
- Synchronous parsing (fast operation)

**Scalable Architecture:**
- Separate tables allow complex queries
- Vocabulary table grows incrementally
- Future enhancements don't require schema changes
