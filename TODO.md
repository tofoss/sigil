# TODO - Note Organization App


## Critical Gaps 🔴

### Search Functionality ✅ COMPLETED
- [x] Implement full-text search using existing `tsv` field in database
- [x] Add search endpoint in backend (with pagination support)
- [x] Create search UI component (context-aware navigation)
- [x] Add pagination to Browse page (50 results per page with Load More)
- [x] Display all notes when search is empty (ordered by update time)
- [ ] Add filter by tags on browse page
- [ ] Add filter by notebooks
- [ ] Add date-based filtering

### Note Deletion
- [x] Add DELETE `/notes/{id}` endpoint in backend
- [x] Add delete button in note view UI
- [x] Add confirmation dialog
- [ ] Consider adding trash/recovery feature

### Recipe Management
- [ ] Create recipes with deepseek prompt only
    - Input name / short description of recipe
    - Create a prompt for deepseek that creates a single recipe based on the input
    - needs to be able to refine the recipe?
- [ ] Create GET `/recipes` endpoint to list all recipes
- [ ] Create GET `/recipes/{id}` endpoint
- [ ] Create PUT `/recipes/{id}` endpoint for editing
- [ ] Create DELETE `/recipes/{id}` endpoint
- [ ] Build recipe browse/list page in frontend
- [ ] Add recipe editing UI
- [ ] Add recipe search/filter functionality
- [ ] Add recipe categories or tags

### Sections Feature ✅ DECISION MADE: Keep & Complete
**Design Document**: `docs/design/sections.md`

**Phase 1: Backend ✅ COMPLETED (1 day)**
- [x] Complete repository methods (9 methods: Upsert, FetchSection, FetchNotebookSections, DeleteSection, UpdateSectionPosition, UpdateSectionName, AssignNoteToSection, FetchSectionNotes, FetchUnsectionedNotes)
- [x] Fix ownership verification via notebook (implemented in all handlers)
- [x] Add missing API endpoints (9 endpoints total)
- [x] Write backend tests (62 test cases, all passing)
- [x] Add repository interfaces for testability
- **Deliverables**: 1,646 lines added across 6 files
- **Commit**: `74c71cb` on `feature/sections-backend` branch

**Phase 2: Frontend CRUD (3-4 days)**
- [x] Create sections API client
- [x] Build SectionManager component
- [x] Update Notebook view to show sections
- [x] Add section selector when adding notes

**Phase 3: Collapsible UI (2-3 days)**
- [x] Create CollapsibleSection component
- [x] Implement localStorage state management

**Phase 4: Drag-and-Drop (3-4 days)**
- [x] Install @dnd-kit
- [x] Implement section reordering
- [x] Build reordering API
- [x] Add visual feedback

### ~Publishing/Sharing~ not priority
- [ ] Add publish toggle in note editor UI
- [ ] Create public share links for published notes
- [ ] Add permissions/privacy settings
- [ ] Consider adding collaboration features

### User Account Management
- [x] Add logout endpoint and button
- [ ] Implement password change functionality
- [ ] Implement password reset (forgot password)
- [ ] Add user profile/settings page
- [ ] Add account deletion option
- [ ] Add email verification (optional)

## Quick Wins 🎯

- [x] Add note deletion (backend + frontend)
- [x] Add logout button
- [x] Implement full-text search ✅
- [x] Add pagination to note lists ✅

## User Experience Improvements

### Content Management
- [ ] Add duplicate/clone note functionality
- [ ] Add note archiving
- [ ] Implement note templates
- [ ] Add note linking (wiki-style backlinks)
- [ ] Add favorites/pinning notes
- [ ] Add manual sorting/ordering options
- [ ] Add different view modes (list, grid, timeline)

### Import/Export
- [ ] Export notes to Markdown
- [ ] Export notes to PDF
- [ ] Export notes to HTML
- [ ] Import from other note apps
- [ ] Bulk export functionality
- [ ] Backup/restore feature

### Quality of Life
- [ ] Add keyboard shortcuts and documentation
- [ ] Add undo/redo functionality
- [ ] Add autosave indicator
- [ ] Add activity/history log
- [ ] Add statistics (note count, word count, etc.)
- [x] Add dark mode toggle ✅ (already exists)
- [x] Improve pagination on long lists ✅ (Browse page has Load More)

## Recipe-Specific Features

- [ ] Add recipe categorization
- [ ] Add meal planning features
- [ ] Add shopping list generation from recipes
- [ ] Add scaling servings functionality
- [ ] Add manual recipe creation (not just URL extraction)
- [ ] Add recipe ratings/favorites

## Infrastructure & Technical Debt

### Backend
- [x] Add rate limiting
- [ ] Implement caching layer (Redis)
- [ ] Add monitoring/observability
- [ ] Document backup strategy
- [ ] Create database migration rollback plan
- [ ] Consider tag scoping (currently global across users)

### Frontend
- [ ] Set up CI/CD pipeline
- [ ] Add end-to-end tests (Playwright)
- [ ] Add performance testing
- [ ] Implement offline support
- [ ] Consider mobile app

### Security
- [x] Security audit
- [ ] Consider encryption at rest
- [ ] Add security audit trail
- [ ] Add two-factor authentication (optional)

## Architecture Decisions Needed

1. ✅ **Sections**: DECIDED - Keep and complete. Collapsible groups with manual ordering. See `docs/design/sections.md`
2. **Tags**: Should they be user-specific or remain global?
3. **Published Notes**: What's the vision for sharing? Public links only, or full collaboration?
4. **File Attachments**: Where to store? S3? Local filesystem?
5. **Rich Text**: Keep markdown-only or add WYSIWYG editor?

## Notes

- Database schema is solid and well-designed
- Repository pattern in backend is clean and maintainable
- Recipe extraction with AI is a unique differentiator
- Consider focusing on either general note-taking OR recipe management as primary feature
