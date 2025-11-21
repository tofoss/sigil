# Sections Feature Design

## Implementation Status

- **Backend**: ✅ Phase 1 Complete (all repository methods, handlers, APIs, and tests implemented)
- **Frontend**: ✅ Phases 2-4 Complete (CRUD UI, collapsible sections, drag-and-drop for sections AND notes)
- **Testing**: ✅ Backend Tests Complete (62 test cases, all passing)
- **Documentation**: ✅ This document (updated with frontend implementation details)

## Overview

Implement sections within notebooks to provide structured, hierarchical organization of notes. Sections act as chapters or dividers within a notebook, allowing users to create book-like structures with ordered, collapsible groups of related notes.

**User Value**: Enables creating structured content like course materials, documentation, project wikis, or any content that benefits from chapter-like organization with manual ordering control.

## Requirements

### Core Functionality

**Section Management:**
- Create sections within a notebook
- Edit section names
- Delete sections (with note handling)
- Reorder sections via drag-and-drop
- Sections have manual position/ordering

**Note Organization:**
- Add notes to specific sections when adding to notebook
- Move notes between sections
- Allow notes to exist in notebook without section (unsectioned)
- Display unsectioned notes in separate group

**Display & Navigation:**
- Sections displayed as collapsible groups in notebook view
- Expand/collapse individual sections
- Remember expand/collapse state (local storage)
- Visual hierarchy: Notebook > Sections > Notes

### Non-Functional Requirements

- Fast section reordering (optimistic UI updates)
- Smooth expand/collapse animations
- Keyboard navigation support (arrow keys, enter to expand)
- Responsive design (works on mobile)
- Maintain performance with many sections/notes

## Use Cases & Examples

### Use Case 1: Course Materials
**Scenario**: Taking "Web Development Course" notes

**Notebook**: "Web Development Course"

**Sections** (ordered):
1. "Week 1 - HTML Basics" (5 notes)
2. "Week 2 - CSS Fundamentals" (8 notes)
3. "Week 3 - JavaScript Intro" (12 notes)
4. "Week 4 - React" (10 notes)
5. "Resources & References" (3 notes)

**Workflow**:
- Create notebook at course start
- Add section for each week as course progresses
- Add lecture notes, assignments to appropriate section
- Collapse completed weeks to focus on current content
- Keep resources section expanded for quick reference

### Use Case 2: Technical Documentation
**Scenario**: Documenting internal API

**Notebook**: "Internal API Documentation"

**Sections**:
1. "Getting Started"
2. "Authentication"
3. "User Endpoints"
4. "Data Endpoints"
5. "Webhooks"
6. "Error Handling"
7. "Changelog"

**Workflow**:
- Structure mirrors typical API docs
- Each section contains multiple notes (one per endpoint or concept)
- Drag to reorder as documentation structure evolves
- Unsectioned notes for quick drafts before organizing

### Use Case 3: Project Management
**Scenario**: Managing "Website Redesign" project

**Notebook**: "Website Redesign Project"

**Sections**:
1. "Planning & Requirements"
2. "Design Phase"
3. "Development"
4. "Testing & QA"
5. "Deployment"
6. "Post-Launch"

**Workflow**:
- Sections represent project phases
- Move notes between sections as project progresses
- Collapse completed phases
- Add ad-hoc notes to unsectioned area for quick capture

## Current Implementation

### Database Schema (Exists - V04__structurization.sql)

```sql
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER DEFAULT 0,  -- For manual ordering
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sections_notebook_id ON sections(notebook_id);

-- Note-to-notebook relationship includes optional section
CREATE TABLE note_notebooks (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    notebook_id UUID NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    PRIMARY KEY (note_id, notebook_id)
);
```

**Schema Notes:**
- ✅ Sections belong to notebooks (1:N relationship)
- ✅ `position` field exists for manual ordering
- ✅ `section_id` is nullable (supports unsectioned notes)
- ✅ `ON DELETE SET NULL` keeps notes when section deleted
- ✅ Cascading deletes when notebook is deleted

### Backend Implementation (Phase 1 Complete ✅)

**Completed in Phase 1:**
- ✅ `models.Section` struct (sigil-go/pkg/models/section.go)
- ✅ Complete `SectionRepository` with 9 methods (sigil-go/pkg/db/repositories/sections.go):
  - `Upsert`, `FetchSection`, `FetchNotebookSections`
  - `DeleteSection`, `UpdateSectionPosition`, `UpdateSectionName`
  - `AssignNoteToSection`, `FetchSectionNotes`, `FetchUnsectionedNotes`
- ✅ Complete `SectionHandler` with 9 handler methods (sigil-go/pkg/handlers/section_handler.go)
- ✅ Full ownership verification via notebook ownership
- ✅ Repository interfaces (`SectionRepositoryInterface`, `NotebookRepositoryInterface`)
- ✅ All 9 API endpoints implemented and tested
- ✅ Comprehensive test suite (62 test cases, all passing)

**Commit**: `74c71cb` on `feature/sections-backend` branch

### Frontend Implementation ✅ Phases 2-4 Complete

**Completed Components:**
- ✅ `SectionCard` - Collapsible section display with notes list
- ✅ `SortableSectionCard` - Wrapper for drag-and-drop section reordering
- ✅ `SectionDialog` - Create/edit section modal
- ✅ `SectionSelector` - Dropdown for assigning notes to sections
- ✅ `DraggableNote` - Draggable note component with grip handle
- ✅ Updated Notebook view with sections support
- ✅ Section management UI (create, edit, delete, reorder)

**Drag-and-Drop Features:**
- ✅ Section reordering via drag-and-drop (using @dnd-kit)
- ✅ Note dragging between sections (including to/from unsectioned)
- ✅ Visual feedback (grip handles, hover states, drop zone highlighting)
- ✅ Optimistic UI updates with error rollback
- ✅ Toast notifications for user feedback

**State Management:**
- ✅ Collapse/expand state stored in localStorage per notebook
- ✅ Custom hook `useCollapsedSections` for state management
- ✅ Refresh mechanism using `refreshKey` for reactive updates

**API Integration:**
- ✅ Complete API client in `src/api/sections.ts`
- ✅ All 9 backend endpoints integrated
- ✅ Error handling and loading states

## What's Missing

### Backend APIs ✅ All Complete (Phase 1)

All backend APIs have been implemented:

1. ✅ **GET `/notebooks/{id}/sections`** - List all sections in notebook (ordered by position)
2. ✅ **GET `/notebooks/{id}/unsectioned`** - Get unsectioned notes in notebook
3. ✅ **GET `/sections/{id}`** - Fetch single section
4. ✅ **POST `/sections`** - Create/update section
5. ✅ **DELETE `/sections/{id}`** - Delete section (notes become unsectioned)
6. ✅ **PUT `/sections/{id}/position`** - Update section position (for reordering)
7. ✅ **PATCH `/sections/{id}`** - Update section name
8. ✅ **GET `/sections/{id}/notes`** - Get all notes in a section
9. ✅ **PUT `/notes/{noteId}/notebooks/{notebookId}/section`** - Assign note to section

### Frontend Components ✅ All Complete

1. ✅ **SectionCard & SectionDialog** - CRUD interface for sections
2. ✅ **Collapsible Sections** - Expandable sections with notes list and localStorage state
3. ✅ **SortableSectionCard & DraggableNote** - Drag-and-drop for sections AND notes
4. ✅ **SectionSelector** - Dropdown to assign notes to sections (in Editor view)
5. ✅ **Updated NotebookView** - Shows sections, unsectioned notes, with full drag-and-drop

### Repository Methods ✅ All Complete (Phase 1)

All repository methods have been implemented and tested:

1. ✅ `Upsert(section)` - Create or update section
2. ✅ `FetchSection(sectionID)` - Get single section
3. ✅ `FetchNotebookSections(notebookID)` - Get all sections ordered by position
4. ✅ `DeleteSection(sectionID)` - Delete and handle notes
5. ✅ `UpdateSectionPosition(sectionID, newPosition)` - Reorder with transaction
6. ✅ `UpdateSectionName(sectionID, newName)` - Rename
7. ✅ `AssignNoteToSection(noteID, notebookID, sectionID)` - Set/update section
8. ✅ `FetchSectionNotes(sectionID)` - Get notes in section
9. ✅ `FetchUnsectionedNotes(notebookID)` - Get notes without section

## Technical Approach

### Section Ordering Strategy

**Option A: Absolute Position (Current)**
- Each section has integer position (0, 1, 2, 3...)
- Reordering requires updating multiple sections
- Simple to understand and query

**Option B: Fractional Position**
- Sections have float position (0.5, 1.5, 2.5...)
- Reordering by inserting between positions (e.g., 1.25 goes between 1.0 and 1.5)
- Fewer database updates
- Needs occasional rebalancing

**Decision: Keep Absolute Position (Option A)**

**Rationale:**
- Already implemented in schema
- Simpler to reason about
- Section counts unlikely to be huge (typically <20)
- Reordering API can batch updates

**Implementation:**
```go
// Reorder: Move section to new position
// Example: Move section from position 3 to position 1
// 1. Increment positions of sections 1-2 (shift right)
// 2. Set moved section to position 1
func (r *SectionRepository) UpdateSectionPosition(
    ctx context.Context,
    sectionID uuid.UUID,
    newPosition int,
) error {
    // Implement in transaction:
    // 1. Get current position
    // 2. Shift other sections
    // 3. Update target section
}
```

### Note-Section Association

Notes belong to sections **within the context of a notebook**. The `note_notebooks` junction table handles this:

```go
// When adding note to notebook with section:
INSERT INTO note_notebooks (note_id, notebook_id, section_id)
VALUES ($1, $2, $3)
ON CONFLICT (note_id, notebook_id)
DO UPDATE SET section_id = $3

// When moving note between sections:
UPDATE note_notebooks
SET section_id = $4
WHERE note_id = $1 AND notebook_id = $2

// Unsectioned notes have section_id = NULL
```

### Collapsible UI State

**Option A: Backend State**
- Store expanded/collapsed state in database
- Syncs across devices
- More database writes

**Option B: Local Storage**
- Store in browser localStorage
- Fast, no backend calls
- Per-device state

**Decision: Local Storage (Option B)**

**Rationale:**
- Expand/collapse is a UI preference, not data
- Reduces backend calls
- Simple implementation
- Users can have different preferences on different devices

**Implementation:**
```typescript
// localStorage key: 'collapsed-sections'
// Value: JSON array of collapsed section IDs
const collapsedSections = JSON.parse(
  localStorage.getItem('collapsed-sections') || '[]'
)

const toggleSection = (sectionId: string) => {
  const updated = collapsedSections.includes(sectionId)
    ? collapsedSections.filter(id => id !== sectionId)
    : [...collapsedSections, sectionId]
  localStorage.setItem('collapsed-sections', JSON.stringify(updated))
}
```

### Drag-and-Drop Implementation

**Library**: Use `@dnd-kit` (modern, accessible, React-focused)

**Approach**:
1. Wrap sections in `<SortableContext>`
2. Each section is `<SortableItem>`
3. On drag end, calculate new position
4. Optimistically update UI
5. Call API to persist order
6. Revert on error

**Key Consideration**: Only section headers are draggable, not the notes within (those have separate move functionality).

### Unsectioned Notes Handling

**Display Options**:
- A) Show at top with "Unsectioned" header
- B) Show at bottom with "Other Notes" header
- C) Show in collapsible "Unsectioned" section

**Decision: Option A - Top with "Unsectioned" header**

**Rationale:**
- Most visible location for quick-capture notes
- Encourages organizing notes into sections
- Consistent with "inbox" mental model
- Easy to drag notes from here into sections

**Query:**
```sql
-- Get unsectioned notes for notebook
SELECT n.*
FROM notes n
JOIN note_notebooks nn ON n.id = nn.note_id
WHERE nn.notebook_id = $1 AND nn.section_id IS NULL
ORDER BY n.updated_at DESC
```

## UI/UX Design

### Notebook View (Updated)

```
┌─────────────────────────────────────────────┐
│ ← Back to Notebooks          [🗑️ Delete]   │
│                                              │
│ 📓 Web Development Course                   │
│ Build modern web applications                │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │ Unsectioned (3)                       │   │
│ │ • Quick note about deployment         │   │
│ │ • TODO: Review TypeScript chapter     │   │
│ │ • Resource: MDN Web Docs               │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ ▼ Week 1 - HTML Basics (5 notes)  [⋮]      │
│   • HTML Document Structure                 │
│   • Semantic HTML Elements                  │
│   • Forms and Validation                    │
│   • Assignment 1 - Portfolio Page           │
│   • Resources and References                │
│                                              │
│ ▶ Week 2 - CSS Fundamentals (8 notes) [⋮]  │
│                                              │
│ ▶ Week 3 - JavaScript Intro (12) [⋮]       │
│                                              │
│ + Add Section                                │
└─────────────────────────────────────────────┘
```

**Interactions**:
- Click ▼/▶ to expand/collapse section
- Click [⋮] menu for: Rename, Delete, Add Note
- Drag section by header to reorder
- Click note title to view/edit
- Click "+ Add Section" to create new section

### Section Management Dialog

```
┌───────────────────────────────────┐
│ Edit Section                [✕]   │
├───────────────────────────────────┤
│                                    │
│ Name:                              │
│ ┌──────────────────────────────┐  │
│ │ Week 3 - JavaScript Intro    │  │
│ └──────────────────────────────┘  │
│                                    │
│ Position: 3                        │
│                                    │
│        [Cancel]  [Save Changes]   │
└───────────────────────────────────┘
```

### Add Note to Notebook Flow

```
When adding existing note to notebook:

┌───────────────────────────────────┐
│ Add to Notebook              [✕]   │
├───────────────────────────────────┤
│                                    │
│ Note: "Introduction to React"     │
│                                    │
│ Notebook:                          │
│ ┌──────────────────────────────┐  │
│ │ ▼ Web Development Course     │  │
│ └──────────────────────────────┘  │
│                                    │
│ Section (optional):                │
│ ┌──────────────────────────────┐  │
│ │ Week 3 - JavaScript Intro  ▼ │  │
│ └──────────────────────────────┘  │
│ Options:                           │
│ • Week 1 - HTML Basics            │
│ • Week 2 - CSS Fundamentals       │
│ • Week 3 - JavaScript Intro ✓     │
│ • Week 4 - React                  │
│ • (No section)                    │
│                                    │
│            [Cancel]  [Add]         │
└───────────────────────────────────┘
```

## Key Decisions

### Decision 1: Allow Unsectioned Notes

**Options Considered:**
- **A) Require all notes to be in a section** - Force section selection
- **B) Allow unsectioned notes** - Section is optional

**Decision: Allow Unsectioned Notes (Option B)**

**Rationale:**
- **Flexibility**: Quick note capture without thinking about organization
- **Progressive organization**: Users can organize notes into sections later
- **Real-world usage**: Not all notes fit neatly into sections
- **Inbox pattern**: Unsectioned area acts as inbox/staging area

**Trade-offs:**
- ✅ Lower friction for adding notes
- ✅ Supports gradual organization
- ✅ Matches how people actually work
- ❌ Can lead to cluttered unsectioned area if not maintained

### Decision 2: Manual Ordering with Drag-and-Drop

**Options Considered:**
- **A) Alphabetical ordering only** - Simple, no manual control
- **B) Manual ordering via drag-and-drop** - User controls position
- **C) Date-based ordering** - Auto-sort by creation/update time

**Decision: Manual Ordering (Option B)**

**Rationale:**
- **Sequential content**: Course weeks, book chapters need specific order
- **User control**: Users know best how to organize their content
- **Industry standard**: Most note apps support manual ordering
- **Use case alignment**: Primary use case (structured hierarchies) requires it

**Implementation**:
- Use `position` integer field
- Implement optimistic updates for smooth UX
- Batch position updates in backend for efficiency

### Decision 3: Collapsible Section Groups

**Options Considered:**
- **A) Always show all notes** - Simple, no state management
- **B) Collapsible sections** - Can expand/collapse
- **C) Tab-based sections** - One section visible at a time

**Decision: Collapsible Sections (Option B)**

**Rationale:**
- **Scalability**: Notebooks with many sections/notes stay manageable
- **Focus**: Collapse irrelevant sections to focus on current work
- **Overview**: Can see all section names at once (unlike tabs)
- **Standard pattern**: Familiar from file explorers, accordions

**State Management**: Use localStorage (see Technical Approach)

### Decision 4: Section Deletion Behavior

**Options Considered:**
- **A) Block deletion if section has notes** - Prevent data loss
- **B) Delete section and notes** - Clean removal
- **C) Delete section, keep notes (unsectioned)** - Safe approach

**Decision: Delete Section, Keep Notes Unsectioned (Option C)**

**Rationale:**
- **Data safety**: Notes are valuable, shouldn't be deleted accidentally
- **Flexibility**: Notes can be reorganized into other sections
- **Database support**: `ON DELETE SET NULL` already implements this
- **Clear communication**: Show warning "X notes will become unsectioned"

**Implementation**:
```
Confirmation dialog when deleting section:
"Delete section 'Week 2 - CSS'?

This section contains 8 notes. These notes will remain
in the notebook but become unsectioned.

[Cancel] [Delete Section]"
```

### Decision 5: Section Ownership & Permissions

**Problem**: How to verify user owns section before operations?

**Current Issue**: Section handler has TODO about ownership verification

**Solution**: Verify via notebook ownership

**Implementation**:
```go
// Verify user owns notebook that contains section
func (h *SectionHandler) verifyOwnership(
    ctx context.Context,
    userID uuid.UUID,
    sectionID uuid.UUID,
) error {
    section, err := h.repo.FetchSection(ctx, sectionID)
    if err != nil {
        return err
    }

    // Get notebook and verify user owns it
    notebook, err := h.notebookRepo.FetchNotebook(
        ctx,
        section.NotebookID,
    )
    if err != nil {
        return err
    }

    if notebook.UserID != userID {
        return ErrUnauthorized
    }

    return nil
}
```

**Rationale:**
- Sections don't have direct user_id (they're scoped to notebooks)
- Notebook ownership implies section ownership
- Consistent with existing permission model

## Implementation Plan

### Phase 1: Complete Backend Foundation ✅ COMPLETED

**Goal**: Finish backend APIs and repositories

**Completed Tasks**:
1. ✅ **Added all repository methods** (9 total):
   - `Upsert`, `FetchSection`, `FetchNotebookSections`
   - `DeleteSection`, `UpdateSectionPosition`, `UpdateSectionName`
   - `AssignNoteToSection`, `FetchSectionNotes`, `FetchUnsectionedNotes`

2. ✅ **Fixed ownership verification**:
   - Implemented verification via notebook ownership
   - Added to all section handler methods
   - Added comprehensive permission checking tests

3. ✅ **Added all API endpoints** (9 total):
   - `GET /notebooks/{id}/sections` - List sections
   - `GET /notebooks/{id}/unsectioned` - Get unsectioned notes
   - `GET /sections/{id}` - Fetch section
   - `POST /sections` - Create/update section
   - `DELETE /sections/{id}` - Delete section
   - `PUT /sections/{id}/position` - Update position
   - `PATCH /sections/{id}` - Update name
   - `GET /sections/{id}/notes` - Get section notes
   - `PUT /notes/{noteId}/notebooks/{notebookId}/section` - Assign to section

4. ✅ **Wrote comprehensive backend tests**:
   - 62 test cases covering all handler methods
   - Tests for CRUD operations, ownership verification, edge cases
   - All tests passing

**Deliverables**:
- 6 files modified/created (1,646 lines added)
- Complete test coverage for all handlers
- Repository interfaces for better testability
- Committed to `feature/sections-backend` branch (commit `74c71cb`)

**Actual Duration**: 1 day (better than estimated 2-3 days)

### Phase 2: Frontend Section Management ✅ COMPLETED

**Goal**: Basic CRUD for sections (no drag-and-drop yet)

**Completed Tasks**:
1. ✅ **Created API client** (`src/api/sections.ts`):
   - All 9 methods implemented and integrated
   - `list`, `create`, `update`, `delete`, `updatePosition`, `updateName`
   - `getNotes`, `getUnsectioned`, `assignNote`

2. ✅ **Built SectionCard component**:
   - Displays section with notes list
   - Section menu with edit/delete actions
   - Delete confirmation dialog with note count warning
   - Visual feedback for dragging states

3. ✅ **Updated Notebook view**:
   - Sections displayed as cards with note lists
   - "Unsectioned Notes" group shown at top when present
   - Section headers with note counts
   - "New Section" button for creating sections

4. ✅ **Added SectionSelector**:
   - Dropdown in Editor view under "Sections" button
   - Shows all sections for each notebook the note belongs to
   - Immediate API call on selection change
   - Supports moving notes to/from unsectioned

**Actual Duration**: ~1 day

### Phase 3: Collapsible UI ✅ COMPLETED

**Goal**: Implement expand/collapse functionality

**Completed Tasks**:
1. ✅ **Integrated collapsible sections in SectionCard**:
   - Click chevron icon to expand/collapse
   - Smooth transitions using Chakra UI components
   - Notes list shown/hidden based on state

2. ✅ **Implemented localStorage state management**:
   - Created custom hook `useCollapsedSections` (in `utils/use-collapsed-sections.ts`)
   - Saves collapsed state per notebook
   - Persists across page refreshes
   - Key format: `collapsed-sections-{notebookId}`

3. ✅ **Visual polish**:
   - Chevron icons (LuChevronDown ▼ for expanded, LuChevronRight ▶ for collapsed)
   - Click entire header area to toggle
   - Smooth transitions
   - Note count displayed in header

**Deferred**:
- Keyboard navigation (can be added later if needed)

**Actual Duration**: <1 day (integrated with Phase 2)

### Phase 4: Drag-and-Drop Reordering ✅ COMPLETED

**Goal**: Manual section ordering via drag-and-drop

**Completed Tasks**:
1. ✅ **Installed and configured @dnd-kit**:
   - Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
   - Version: core ^6.3.1, sortable ^10.0.0, utilities ^3.2.2

2. ✅ **Implemented drag-and-drop for sections**:
   - Created `SortableSectionCard` wrapper component
   - Uses `useSortable` hook for section reordering
   - Single `DndContext` with `pointerWithin` collision detection
   - `SortableContext` with `verticalListSortingStrategy`
   - Optimistic UI updates with `arrayMove`

3. ✅ **Implemented drag-and-drop for notes between sections** (BONUS):
   - Created `DraggableNote` component with `useDraggable` hook
   - Each section is droppable using `useDroppable`
   - Combined `useSortable` and `useDroppable` in `SortableSectionCard`
   - Drag notes from any section to any other section (including unsectioned)
   - Visual grip handles (LuGripVertical) on notes
   - Sections highlight when dragging notes over them

4. ✅ **Built unified drag handler**:
   - Single `handleDragEnd` function distinguishes between:
     - Section reordering (type: "section-sort")
     - Note dragging (type: "note")
   - Optimistic updates for sections with rollback on error
   - Refresh mechanism using `refreshKey` for reactive note updates
   - Prevents no-op drops (same section)

5. ✅ **Added visual feedback**:
   - Grip handle icon on section headers (only when draggable)
   - Grip handle icons on notes (30% opacity, full on hover)
   - Drop zone highlighting (background + border on `isOver`)
   - Success/error toast notifications
   - Smooth transitions and animations

**Key Implementation Details**:
- Uses single DndContext to avoid nesting issues
- `pointerWithin` collision detection for accurate drop targeting
- `refreshKey` prop passed to all sections for reactive updates
- Combined refs approach for elements that are both sortable and droppable

**Actual Duration**: ~2 days (including note dragging feature)

### Phase 5: Polish & Testing ⏸️ DEFERRED

**Goal**: Refinement and quality assurance

**Completed:**
- ✅ Basic edge case handling (empty sections, delete confirmation, no-op drops)
- ✅ Error handling with rollback (optimistic updates)
- ✅ Toast notifications for user feedback

**Remaining Tasks** (to be done as needed):
1. **Additional edge case testing**:
   - Deleting last section
   - Reordering with network errors
   - Large notebooks with many sections/notes

2. **Responsive design improvements**:
   - Mobile-friendly touch drag handles
   - Simplified UI for small screens
   - Test on various device sizes

3. **Performance optimization** (if needed):
   - Virtualize long note lists
   - Lazy load section contents
   - Optimize re-renders

4. **User testing**:
   - Test with real note structures
   - Gather feedback on UX
   - Iterate based on feedback

5. **Documentation**:
   - User guide updates
   - Examples/templates
   - Keyboard shortcuts documentation

**Total Actual Duration (Phases 1-4)**: ~4 days (vs. estimated 10-14 days)

## Testing Strategy

### Backend Tests

**Repository Tests**:
- ✅ Create section
- ✅ Fetch section
- ✅ Update section name
- ✅ Delete section
- ✅ List notebook sections (ordered)
- ✅ Reorder sections
- ✅ Assign note to section
- ✅ Get section notes
- ✅ Handle unsectioned notes

**Handler Tests**:
- ✅ All CRUD endpoints
- ✅ Permission checks (ownership verification)
- ✅ Invalid inputs
- ✅ Edge cases (empty notebooks, etc.)

**Integration Tests** (optional):
- Full workflow: Create notebook → Add sections → Add notes → Reorder

### Frontend Tests

**Component Tests** (Vitest):
- CollapsibleSection expand/collapse
- Section list rendering
- Add/edit/delete section forms
- Unsectioned notes display

**Integration Tests**:
- Full notebook view with sections
- Drag-and-drop reordering
- Adding notes to sections
- State persistence (localStorage)

**E2E Tests** (Playwright):
- Complete user journey: Create notebook → Add sections → Add notes → Organize
- Drag-and-drop behavior
- Cross-browser testing

### UX Scenarios to Test

1. **Happy Path**: Create notebook, add 3 sections, add notes to each, reorder sections
2. **Unsectioned Workflow**: Add notes without sections, organize later
3. **Delete Section**: Delete section with notes, verify notes become unsectioned
4. **Move Notes**: Move notes between sections
5. **Collapse State**: Collapse sections, refresh page, verify state persists
6. **Mobile Usage**: Complete workflow on mobile device

## Future Enhancements

### Short Term
- Section descriptions (optional text under section name)
- Section colors or icons for visual distinction
- Bulk move notes between sections
- Section templates (pre-defined section sets)

### Medium Term
- Nested sections (sub-sections)
- Section-level permissions (for collaboration)
- Export section as standalone document
- Search within specific section

### Long Term
- Section links (reference sections in notes)
- Section analytics (note count, last updated, etc.)
- Auto-organize notes into sections (AI-powered)
- Section sharing without sharing entire notebook

## Open Questions

1. **Nested sections?** Should sections support sub-sections, or keep it flat?
   - **Recommendation**: Start flat, add nesting if users request it
   - Reasoning: YAGNI principle, avoid over-engineering

2. **Section visibility?** Should sections support being hidden/archived?
   - **Recommendation**: Not in MVP, add if needed later
   - Reasoning: Collapsing provides sufficient "hiding" for now

3. **Section limit?** Should we limit number of sections per notebook?
   - **Recommendation**: No hard limit, but show warning if >50 sections
   - Reasoning: UX degrades with too many sections, but shouldn't block power users

4. **Default section?** When creating notebook, auto-create "General" section?
   - **Recommendation**: No, start with empty notebook
   - Reasoning: Users should choose their own structure

## Success Metrics

**Adoption**:
- % of notebooks using sections (target: >40% after 3 months)
- Average sections per notebook (expect 3-7)
- % of notes in sections vs. unsectioned (target: >60% in sections)

**Usability**:
- Time to create and populate section (<30 seconds)
- Section reordering success rate (target: >95%)
- User feedback on section UX (target: positive sentiment)

**Technical**:
- API response times (<100ms for section operations)
- No N+1 query issues
- Zero data loss incidents during section operations

## Implementation Files

### Backend (Phase 1)
- Database schema: `db/V04__structurization.sql`
- Models: `sigil-go/pkg/models/section.go`, `sigil-go/pkg/models/notebook.go` (added section_id field)
- Repository: `sigil-go/pkg/db/repositories/sections.go`
- Handler: `sigil-go/pkg/handlers/section_handler.go`
- Tests: `sigil-go/pkg/handlers/section_handler_test.go` (62 test cases)

### Frontend (Phases 2-4)
- API Client: `sigil-frontend/src/api/sections.ts`
- Models: `sigil-frontend/src/api/model/notebook.ts` (added section_id), `sigil-frontend/src/api/model/section.ts`
- Components:
  - `sigil-frontend/src/components/ui/section-card.tsx` - Main section display
  - `sigil-frontend/src/components/ui/sortable-section-card.tsx` - Drag-and-drop wrapper
  - `sigil-frontend/src/components/ui/section-dialog.tsx` - Create/edit modal
  - `sigil-frontend/src/components/ui/section-selector.tsx` - Section assignment dropdown
  - `sigil-frontend/src/components/ui/draggable-note.tsx` - Draggable note component
- Pages: `sigil-frontend/src/pages/Notebook/index.tsx` - Updated with sections support
- Utilities: `sigil-frontend/src/utils/use-collapsed-sections.ts` - Collapse state hook
- Editor: `sigil-frontend/src/modules/editor/Editor.tsx` - Added section selector button

## References

- @dnd-kit docs: https://docs.dndkit.com/
- Chakra UI: https://chakra-ui.com/
- Database migrations: Uses `golang-migrate`
- Testing: `go test` for backend, Vitest for frontend (planned)
