# Sidebar Tree Navigation Design

## Implementation Status

- **Design**: ✅ Complete (this document)
- **Backend**: ✅ No changes needed (all APIs already exist)
- **Frontend**: ✅ Complete (all components implemented and integrated)
- **Testing**: ⏸️ Manual testing needed (edge cases, mobile functionality)
- **Documentation**: ✅ This document

## Overview

Implement a hierarchical tree navigation in the sidebar that displays the full notebook → section → note hierarchy. This provides users with persistent, at-a-glance access to their entire note organization structure from any page in the application.

**User Value**: Users can navigate directly to any notebook, section, or note without multiple page transitions. The tree view provides context about where notes live in the hierarchy and enables quick access to frequently used content.

## Requirements

### Core Functionality

**Tree Structure:**
- Three-level hierarchy: Notebooks → Sections → Notes
- Expand/collapse notebooks to show/hide sections and unsectioned notes
- Expand/collapse sections to show/hide notes
- Display unsectioned notes within each notebook

**Navigation:**
- Click notebook name → navigate to notebook detail page
- Click section name → expand/collapse section (no navigation)
- Click note name → navigate to note editor page
- Visual highlighting of current page context

**State Persistence:**
- Remember expanded/collapsed state using localStorage
- Persist state across page refreshes and sessions
- Per-user state (scoped to browser)

**Layout Integration:**
- Tree view appears below existing navigation menu
- Separated by visual divider
- Scrollable if content exceeds sidebar height
- Works in both desktop sidebar and mobile drawer

### Non-Functional Requirements

- Fast initial load (< 500ms for typical user with 10-20 notebooks)
- Smooth expand/collapse animations
- Responsive to screen sizes
- Accessible (keyboard navigation, screen readers)
- Handle edge cases (empty notebooks, very long names)

## Use Cases & Examples

### Use Case 1: Quick Note Access
**Scenario**: User remembers note is in "Week 3" section of "Web Dev Course" notebook

**Workflow**:
1. User opens any page in app
2. Looks at sidebar tree
3. Sees "Web Dev Course" notebook (maybe already expanded from previous session)
4. Expands notebook if collapsed
5. Sees "Week 3 - JavaScript Intro" section
6. Expands section if collapsed
7. Clicks on "Array Methods" note
8. Navigates directly to note editor

**Without tree view**:
- Navigate to Notebooks list → Find notebook → Click → Scroll to section → Click note
- 4 clicks + scrolling vs. 1-3 clicks

### Use Case 2: Context Awareness
**Scenario**: User is editing a note and wants to see what else is in the same section

**Workflow**:
1. User is on note editor page
2. Looks at sidebar tree
3. Sees current note highlighted
4. Sees parent section expanded showing sibling notes
5. Can click directly to another note in same section

**Value**: Provides spatial awareness and related content discovery

### Use Case 3: Organization Overview
**Scenario**: User wants to see overall content structure

**Workflow**:
1. User looks at sidebar
2. Sees all notebook names with note counts
3. Expands a few notebooks to see sections
4. Gets quick sense of content organization
5. Identifies notebooks that need organizing (many unsectioned notes)

**Value**: Dashboard-like view of entire content hierarchy

## Current State Analysis

### Existing Navigation
From research (see research agent output):

**Current sidebar shows:**
- Home
- Browse notes
- New Note
- New Recipe
- Notebooks
- Structure

**Current workflow for navigating to a note:**
1. Click "Notebooks" → Notebooks list page
2. Find and click notebook → Notebook detail page
3. Scroll to find section
4. Click note → Note editor

**Limitations:**
- No persistent view of notebook hierarchy
- Must navigate through multiple pages
- Loses context when viewing a note
- No visual indication of current location in hierarchy

### Available APIs (All Exist ✅)

From sections implementation:
- `notebooks.list()` - Get all user's notebooks
- `sections.list(notebookId)` - Get sections in a notebook
- `sections.getUnsectioned(notebookId)` - Get unsectioned notes
- `sections.getNotes(sectionId)` - Get notes in a section

### Available UI Components

From Chakra UI:
- Box, Stack, HStack, VStack - Layout
- Icon - Icon display
- Text - Typography
- Collapse - Smooth expand/collapse
- Skeleton - Loading states
- Divider - Visual separation

## Technical Approach

### Component Architecture

**4-Component Design:**

```
NotebookTree (container)
├── NotebookTreeItem (notebook)
│   ├── SectionTreeItem (section)
│   │   └── NoteTreeItem (note)
│   │   └── NoteTreeItem (note)
│   └── NoteTreeItem (unsectioned note)
├── NotebookTreeItem (notebook)
│   └── ...
└── NotebookTreeItem (notebook)
```

**Component Responsibilities:**

1. **NotebookTree** (Container)
   - Fetch all data on mount
   - Manage global expand/collapse state
   - Render list of notebooks
   - Handle loading and error states

2. **NotebookTreeItem** (Notebook level)
   - Display notebook with chevron and icon
   - Handle expand/collapse for this notebook
   - Render unsectioned notes (if any)
   - Render sections when expanded

3. **SectionTreeItem** (Section level)
   - Display section with chevron and icon
   - Handle expand/collapse for this section
   - Render notes when expanded

4. **NoteTreeItem** (Leaf node)
   - Display note with icon
   - Navigate to note on click
   - Highlight if current page

### Data Loading Strategy

**Decision: Load All Data Upfront**

**Rationale:**
- User selected "Load all upfront" in requirements gathering
- Simpler implementation (no lazy loading logic)
- Better UX once loaded (instant expand/collapse)
- Typical user has 10-50 notebooks, manageable data size
- Can optimize later if performance becomes issue

**Implementation:**
```typescript
const fetchTreeData = async () => {
  // 1. Fetch all notebooks
  const notebooksData = await notebooks.list()

  // 2. For each notebook, fetch sections and unsectioned notes in parallel
  const treeData = await Promise.all(
    notebooksData.map(async (notebook) => {
      const [sections, unsectionedNotes] = await Promise.all([
        sections.list(notebook.id),
        sections.getUnsectioned(notebook.id)
      ])

      // 3. For each section, fetch notes
      const sectionsWithNotes = await Promise.all(
        sections.map(async (section) => ({
          section,
          notes: await sections.getNotes(section.id)
        }))
      )

      return {
        notebook,
        sections: sectionsWithNotes,
        unsectionedNotes
      }
    })
  )

  return treeData
}
```

**Performance Considerations:**
- For 20 notebooks with average 5 sections each, ~100 notes total:
  - 1 request for notebooks
  - 40 requests for sections/unsectioned (20 notebooks × 2 requests)
  - 100 requests for section notes (20 notebooks × 5 sections)
  - Total: ~141 requests
- Can batch/parallelize requests
- Add caching layer if needed
- Consider debounced refresh on data changes

### State Management

**localStorage Structure:**

```typescript
// Key: 'expanded-notebooks'
// Value: ['notebook-uuid-1', 'notebook-uuid-2']

// Key: 'expanded-sections'
// Value: ['section-uuid-1', 'section-uuid-2']
```

**State Hooks:**

```typescript
// Custom hook for managing expand/collapse state
const useTreeExpansion = () => {
  const [expandedNotebooks, setExpandedNotebooks] = useState<string[]>(() => {
    const stored = localStorage.getItem('expanded-notebooks')
    return stored ? JSON.parse(stored) : []
  })

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    const stored = localStorage.getItem('expanded-sections')
    return stored ? JSON.parse(stored) : []
  })

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks(prev => {
      const updated = prev.includes(id)
        ? prev.filter(nid => nid !== id)
        : [...prev, id]
      localStorage.setItem('expanded-notebooks', JSON.stringify(updated))
      return updated
    })
  }

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const updated = prev.includes(id)
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
      localStorage.setItem('expanded-sections', JSON.stringify(updated))
      return updated
    })
  }

  return {
    expandedNotebooks,
    expandedSections,
    toggleNotebook,
    toggleSection,
    isNotebookExpanded: (id: string) => expandedNotebooks.includes(id),
    isSectionExpanded: (id: string) => expandedSections.includes(id)
  }
}
```

### Active Item Highlighting

**Determine active context from current route:**

```typescript
const useActiveContext = () => {
  const location = useLocation()
  const { id } = useParams()

  // Parse route to determine what's active
  if (location.pathname.startsWith('/notebooks/')) {
    return { type: 'notebook', id: id! }
  } else if (location.pathname.startsWith('/notes/')) {
    return { type: 'note', id: id! }
  }

  return { type: null, id: null }
}
```

**Apply highlighting:**
- Active notebook: Bold text or background color
- Active note: Bold text + background highlight
- Automatically expand parent notebook/section of active note

### Visual Design

**Indentation:**
- Notebooks: 0px padding-left
- Sections: 12px padding-left (relative to notebook)
- Unsectioned notes: 12px padding-left
- Section notes: 24px padding-left (relative to notebook)

**Icons:**
- Notebook: `LuBookOpen` (matches existing usage)
- Section: `LuFolder` or `LuFolders`
- Note: `LuFileText` or `LuStickyNote`
- Chevron: `LuChevronRight` (collapsed), `LuChevronDown` (expanded)

**Interaction States:**
- Hover: Subtle background color (`bg.subtle`)
- Active: Stronger background + bold text
- Clickable areas: Full-width for better UX

**Animations:**
- Chevron rotation: 90deg transition on expand
- Collapse/expand: Smooth height transition using Chakra Collapse
- Duration: 200-300ms for snappy feel

**Text Handling:**
- Truncate long names with ellipsis
- Show full name on hover (tooltip)
- Minimum readable width even in collapsed sidebar

## UI/UX Design

### Desktop Sidebar Layout

```
┌──────────────────────────────────┐
│ 🏠 Home                          │
│ 📖 Browse notes                  │
│ ➕ New Note                       │
│ 👨‍🍳 New Recipe                     │
│ 📚 Notebooks                      │
│ ⚛️  Structure                     │
├──────────────────────────────────┤ ← Divider
│ My Notebooks (3)                 │
│                                  │
│ ▼ 📖 Web Development Course     │ ← Expanded notebook
│   │ 🗒️  Quick deployment note    │ ← Unsectioned
│   ▼ 📁 Week 1 - HTML            │ ← Expanded section
│     │ 📄 HTML Document Structure │
│     │ 📄 Semantic Elements       │
│   ▶ 📁 Week 2 - CSS             │ ← Collapsed section
│   ▶ 📁 Week 3 - JavaScript      │
│                                  │
│ ▶ 📖 Project Notes               │ ← Collapsed notebook
│                                  │
│ ▼ 📖 Personal Wiki              │ ← Expanded notebook
│   ▶ 📁 Health & Fitness         │
│   ▶ 📁 Recipes                  │
└──────────────────────────────────┘
```

### Mobile Drawer

Same tree structure appears in the drawer menu that slides in from left on mobile.

### Empty States

**No notebooks:**
```
┌──────────────────────────────────┐
│ My Notebooks (0)                 │
│                                  │
│ No notebooks yet.                │
│ Create one to get started!       │
│                                  │
│ [+ New Notebook]                 │
└──────────────────────────────────┘
```

**Notebook with no content:**
```
│ ▼ 📖 Empty Notebook              │
│   (No sections or notes)         │
```

## Key Decisions

### Decision 1: Full 3-Level Tree vs. Partial

**Options Considered:**
- A) Just notebooks (simplest)
- B) Notebooks + sections
- C) Notebooks + sections + notes (full tree)

**Decision: Full 3-Level Tree (Option C)**

**Rationale:**
- User explicitly selected this option
- Provides complete navigation without page changes
- Enables direct note access from any page
- Shows full context and relationships
- Users with many notes can collapse sections to manage space

**Trade-offs:**
- ✅ Complete navigation capability
- ✅ Full visibility of content structure
- ✅ Direct access to any note
- ❌ Can become tall with many notes
- ❌ More API requests on load
- ❌ More complex state management

**Mitigation:**
- Collapsible sections control height
- Sidebar scrolls if needed
- Can add virtualization later if performance issues

### Decision 2: Integration with Existing Nav

**Options Considered:**
- A) Replace existing nav menu
- B) Add below existing nav menu
- C) Separate collapsible section

**Decision: Below Existing Nav Menu (Option B)**

**Rationale:**
- User explicitly selected this option
- Preserves existing navigation patterns
- Gradual enhancement (doesn't break existing workflows)
- Clear separation: global actions (top) vs. content tree (below)
- Easy to implement without major layout changes

**Implementation:**
```tsx
<Box overflowY="auto" flex={1}>
  <NavMenu pages={Object.values(pages.private)} />
  <Divider my={4} />
  <Heading size="sm" mb={2} px={4}>My Notebooks</Heading>
  <NotebookTree />
</Box>
```

### Decision 3: Data Loading Strategy

**Options Considered:**
- A) Lazy load (fetch sections on notebook expand)
- B) Load all upfront
- C) Hybrid (notebooks upfront, lazy sections)

**Decision: Load All Upfront (Option B)**

**Rationale:**
- User explicitly selected this option
- Simpler implementation (no lazy loading logic)
- Better UX after initial load (instant expand)
- Typical data size is manageable
- Can add caching to reduce redundant requests

**Trade-offs:**
- ✅ Simple implementation
- ✅ Fast expand/collapse after load
- ✅ Works offline once loaded
- ❌ Slower initial load
- ❌ More API requests
- ❌ May need optimization for power users

**Future Optimization:**
- Add refresh button or auto-refresh mechanism
- Implement caching layer
- Consider lazy loading if users have 100+ notebooks

### Decision 4: Section Click Behavior

**Options Considered:**
- A) Navigate to notebook with section focused
- B) Create new section detail page
- C) Just expand/collapse (no navigation)

**Decision: Just Expand/Collapse (Option C)**

**Rationale:**
- User explicitly selected this option
- Consistent with typical tree view behavior
- No need for new routes/pages
- Notes are the primary content, sections are organizers
- Clicking notes provides the navigation

**Trade-offs:**
- ✅ Simple, predictable behavior
- ✅ No new routes needed
- ✅ Faster to implement
- ❌ Can't link directly to a section
- ❌ No section-specific views

**Alternative for future:**
- Add context menu with "Go to Notebook" option
- Shift+click could navigate to notebook with section focused

### Decision 5: Expand/Collapse State Persistence

**Options Considered:**
- A) No persistence (always collapsed on load)
- B) localStorage (per-browser)
- C) Backend storage (synced across devices)

**Decision: localStorage (Option B)**

**Rationale:**
- Consistent with existing sections collapse state implementation
- Fast (no API calls)
- Good UX (remembers user preferences)
- Per-device preferences make sense (mobile vs desktop users may want different states)

**Implementation:**
- Use same pattern as `useCollapsedSections` hook
- Store arrays of expanded IDs
- Clear old data if notebooks/sections deleted

**Future Enhancement:**
- Add backend sync if users request it
- Could offer "Sync preferences" setting

## Implementation Plan

### Phase 1: Core Tree Structure

**Goal**: Build basic tree components with static/mock data

**Tasks**:
1. Create `NotebookTree` container component
   - Render "My Notebooks" heading
   - Mock data structure for testing
   - Basic expand/collapse state (useState, no persistence yet)

2. Create `NotebookTreeItem` component
   - Render notebook with chevron icon
   - Click chevron to toggle expand
   - Click name to navigate to notebook page
   - Show unsectioned notes when expanded
   - Show sections list when expanded

3. Create `SectionTreeItem` component
   - Render section with chevron icon
   - Click chevron to toggle expand
   - Show notes list when expanded
   - Proper indentation

4. Create `NoteTreeItem` component
   - Render note with icon
   - Click to navigate to note page
   - Truncate long titles
   - Proper indentation

**Duration**: 1 day

### Phase 2: Data Integration

**Goal**: Connect to real APIs and handle loading states

**Tasks**:
1. Implement data fetching in `NotebookTree`:
   - Fetch all notebooks
   - Fetch sections and unsectioned notes for each
   - Fetch notes for each section
   - Build nested data structure

2. Add loading states:
   - Skeleton loaders while fetching
   - Error handling with retry
   - Empty states (no notebooks, no notes)

3. Test with real data:
   - Various sizes (empty to 20+ notebooks)
   - Edge cases (very long names, special characters)

**Duration**: 1 day

### Phase 3: State Persistence & Highlighting

**Goal**: Remember expanded state and highlight active items

**Tasks**:
1. Create `useTreeExpansion` hook:
   - Load expanded state from localStorage
   - Provide toggle functions
   - Save changes to localStorage

2. Implement active item detection:
   - Parse current route
   - Determine active notebook/section/note
   - Auto-expand parent items of active note

3. Add visual highlighting:
   - Bold text for active items
   - Background color for active note
   - Ensure accessibility (contrast ratios)

**Duration**: 1 day

### Phase 4: Layout Integration & Polish

**Goal**: Integrate into main layout and polish UX

**Tasks**:
1. Update `Layout.tsx`:
   - Add `NotebookTree` below `NavMenu`
   - Add divider
   - Ensure proper scrolling
   - Test in mobile drawer

2. Visual polish:
   - Smooth animations for expand/collapse
   - Hover states
   - Consistent spacing and alignment
   - Icons properly sized and colored

3. Edge case handling:
   - Very long notebook/section/note names
   - Many items (test scrolling)
   - Empty notebooks
   - Rapid expand/collapse (prevent animation jank)

4. Accessibility:
   - Keyboard navigation (tab, enter, arrows)
   - Screen reader labels
   - Focus management

**Duration**: 1 day

### Phase 5: Testing & Documentation

**Goal**: Ensure quality and document for future maintainers

**Tasks**:
1. Manual testing:
   - Test all navigation flows
   - Test expand/collapse persistence
   - Test on different screen sizes
   - Test with various data scenarios

2. Code cleanup:
   - Remove console.logs
   - Add comments for complex logic
   - Ensure consistent naming

3. Documentation:
   - Update this design doc with "Completed" status
   - Add code comments
   - Document any deviations from plan

**Duration**: 0.5 days

**Total Estimated Duration**: 4.5 days

## Testing Strategy

### Manual Testing Scenarios

1. **Empty State**:
   - New user with no notebooks
   - Should show helpful message
   - Verify "New Notebook" link works

2. **Basic Navigation**:
   - Create notebook with sections and notes
   - Verify tree populates correctly
   - Click each level (notebook, section, note)
   - Verify navigation works
   - Verify highlighting shows active item

3. **Expand/Collapse**:
   - Expand/collapse notebooks and sections
   - Refresh page
   - Verify state persists
   - Clear localStorage and verify default state

4. **Active Item Highlighting**:
   - Navigate to various notes
   - Verify correct notebook/section auto-expands
   - Verify active note is highlighted
   - Verify parent section is expanded

5. **Edge Cases**:
   - Very long notebook/section/note names
   - Notebooks with 50+ notes
   - Empty notebooks (no sections/notes)
   - Notebooks with only unsectioned notes
   - Rapid expand/collapse clicking

6. **Performance**:
   - Time initial load with 20 notebooks
   - Should be < 500ms on decent connection
   - Verify no UI jank during expand/collapse

7. **Mobile**:
   - Test in mobile drawer
   - Verify tree renders correctly
   - Verify touch interactions work
   - Test with various viewport sizes

### Automated Testing (Future)

**Component Tests** (Vitest):
- NotebookTreeItem renders correctly
- Expand/collapse updates state
- Click handlers fire with correct data
- Loading states show skeletons
- Empty states show correctly

**Integration Tests**:
- Full tree loads with mock data
- Navigation works end-to-end
- State persists to localStorage
- Active highlighting updates on route change

**E2E Tests** (Playwright):
- Complete user flow: Create notebook → Add section → Add note → Navigate via tree
- Verify tree state persists across sessions
- Mobile drawer functionality

## Future Enhancements

### Short Term
- Refresh button to reload tree data
- Auto-refresh when data changes (via events or polling)
- Keyboard shortcuts (Cmd+K to focus tree, arrow keys to navigate)
- Search/filter within tree
- Drag-and-drop to reorder notebooks (favorites at top)

### Medium Term
- Right-click context menus (Edit, Delete, New Section, etc.)
- Notebook badges/icons for visual distinction
- Note count badges on notebooks/sections
- Virtualization for large trees (render only visible items)
- Sync expand/collapse preferences to backend

### Long Term
- Favorites/pinning (keep certain notebooks at top)
- Custom notebook ordering (manual drag-and-drop)
- Tree view settings (show/hide icons, compact mode)
- Multiple tree views (by tag, by date, by type)
- Collaborative features (shared notebooks indicator)

## Success Metrics

**Adoption**:
- % of users who expand at least one notebook in tree (target: >60%)
- Average notebooks expanded per session (expect 2-4)
- % of navigation to notes that comes via tree vs. other methods (target: >40%)

**Usability**:
- Time to navigate to a note via tree (target: < 5 seconds)
- Error rate (clicked wrong item) (target: < 5%)
- User feedback on tree navigation UX

**Technical**:
- Initial load time for tree (target: < 500ms for 20 notebooks)
- Tree render time (target: < 100ms)
- No errors during expand/collapse
- localStorage size stays manageable (< 10KB)

## Open Questions

1. **What happens when a notebook/section/note is deleted while tree is loaded?**
   - **Recommendation**: Show "not found" error on click, add refresh button
   - Alternative: Add real-time updates via WebSocket or polling

2. **Should we show note count badges on notebooks/sections?**
   - **Recommendation**: Yes, in parentheses like "Web Dev (23 notes)"
   - Helps users find content-rich notebooks

3. **How to handle very long note titles?**
   - **Recommendation**: Truncate with ellipsis, show full title on hover tooltip
   - Keep readable even at narrow sidebar widths

4. **Should tree auto-scroll to active item on page load?**
   - **Recommendation**: Yes, use `scrollIntoView` but with smooth behavior
   - Ensure it doesn't scroll away from top if user intentionally scrolled

5. **What if fetching tree data fails?**
   - **Recommendation**: Show error message with retry button
   - Fall back to showing just notebooks list (no sections/notes)

## Completed Implementation

### Implementation Date
Completed in ~4 hours (estimated 4.5 days, actual much faster)

### Components Created

**1. NoteTreeItem** (`src/shared/Layout/NotebookTree/NoteTreeItem.tsx`)
- Displays individual note with file icon
- Navigates to note editor on click
- Highlights when active (current route)
- Truncates long titles with ellipsis
- Custom padding for proper indentation

**2. SectionTreeItem** (`src/shared/Layout/NotebookTree/SectionTreeItem.tsx`)
- Displays section with folder icon and chevron
- Expands/collapses to show/hide notes
- Shows note count in parentheses
- Chevron rotates on expand (90deg transition)
- Empty state message when no notes

**3. NotebookTreeItem** (`src/shared/Layout/NotebookTree/NotebookTreeItem.tsx`)
- Displays notebook with book icon and chevron
- Separate click handlers: chevron toggles, name navigates
- Shows total note count across all sections
- Displays unsectioned notes with label
- Renders all sections with their notes
- Empty state when no content

**4. NotebookTree** (`src/shared/Layout/NotebookTree/NotebookTree.tsx`)
- Container component managing all data fetching
- Fetches notebooks, sections, and notes in parallel
- Loading state with skeleton loaders
- Error state with error message
- Empty state with helpful message
- Auto-expands to show active note on page load
- Uses useTreeExpansion hook for state management

**5. useTreeExpansion Hook** (`src/shared/Layout/NotebookTree/useTreeExpansion.ts`)
- Manages expand/collapse state for notebooks and sections
- Persists state to localStorage
- Provides toggle and expand functions
- Returns helper functions to check expansion state
- Handles localStorage errors gracefully

### Layout Integration

**Updated Layout.tsx:**
- Added NotebookTree below NavMenu in both desktop sidebar and mobile drawer
- Added Separator (divider) between navigation and tree
- Made sidebar scrollable with `overflowY="auto"`
- Maintained responsive behavior (drawer on mobile, sidebar on desktop)

### Key Implementation Details

**Data Fetching Strategy:**
- Single useEffect on mount fetches all data
- Parallel API calls for efficiency (Promise.all)
- Nested structure: notebooks → (sections + unsectioned notes) → notes per section
- ~141 API calls for 20 notebooks with 5 sections each (manageable)

**Expand/Collapse:**
- Conditional rendering (`{isExpanded && ...}`) instead of Chakra Collapse
- Smooth chevron rotation with CSS transition
- State persisted to localStorage with keys:
  - `expanded-notebooks`: Array of expanded notebook IDs
  - `expanded-sections`: Array of expanded section IDs

**Active Item Detection:**
- Parses current route using useLocation and useParams
- Detects if on /notes/:id or /notebooks/:id
- Auto-expands parent notebook and section of active note
- Visual highlighting with background color and bold text

**Visual Design:**
- Indentation: Notebooks (0px), Sections (12px), Notes (24px for sections, 12px for unsectioned)
- Icons: LuBookOpen (notebook), LuFolder (section), LuFileText (note)
- Chevron: LuChevronRight (rotates to 90deg when expanded)
- Hover effects: bg.subtle
- Active note: bg.muted + semibold
- Smooth transitions on background changes

### Deviations from Plan

**Simplified from original design:**
1. **No Collapse component**: Used conditional rendering instead (simpler, worked better with Chakra UI)
2. **Faster implementation**: 4 hours vs. estimated 4.5 days (experience with similar components, good planning)
3. **Link handling**: Wrapped HStack in Link component instead of using `as={Link}` prop (TypeScript compatibility)

**Everything else followed the plan exactly:**
- 4-component architecture as designed
- Data loading strategy as specified
- localStorage state management as planned
- Active item detection and auto-expand as designed
- Layout integration as specified

### Files Created/Modified

**New Files (6):**
- `src/shared/Layout/NotebookTree/NoteTreeItem.tsx`
- `src/shared/Layout/NotebookTree/SectionTreeItem.tsx`
- `src/shared/Layout/NotebookTree/NotebookTreeItem.tsx`
- `src/shared/Layout/NotebookTree/NotebookTree.tsx`
- `src/shared/Layout/NotebookTree/useTreeExpansion.ts`
- `src/shared/Layout/NotebookTree/index.ts`

**Modified Files (1):**
- `src/shared/Layout/Layout.tsx` - Added NotebookTree integration

**Total Lines Added**: ~500 lines of TypeScript/React code

### Testing Status

**Completed:**
- ✅ Build succeeds with no TypeScript errors
- ✅ All components created and integrated
- ✅ Loading states implemented
- ✅ Error handling implemented
- ✅ Active item detection implemented

**Remaining (Manual Testing Needed):**
- ⏸️ Test with real data (empty notebooks, many notes, etc.)
- ⏸️ Test mobile drawer functionality
- ⏸️ Test edge cases (very long names, rapid clicking, etc.)
- ⏸️ Test expand/collapse state persistence across refreshes
- ⏸️ Test active item auto-expansion

### Next Steps

1. **User Testing**: Test the tree navigation in the running application
2. **Edge Cases**: Test with various data scenarios (empty, large, deeply nested)
3. **Mobile**: Verify drawer works correctly on mobile devices
4. **Performance**: Monitor load time with many notebooks
5. **Refinements**: Based on user feedback, add improvements from "Future Enhancements" section

## References

- Existing collapsible sections: `src/utils/use-collapsed-sections.ts`
- Navigation menu: `src/shared/Layout/NavMenu/NavMenu.tsx`
- Layout: `src/shared/Layout/Layout.tsx`
- Sections design doc: `docs/design/sections.md`
- Chakra UI: https://chakra-ui.com/
- React Icons (Lucide): https://react-icons.github.io/react-icons/icons/lu/
