import {
  Box,
  HStack,
  Heading,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react"
import { notebooks, sections, noteClient } from "api"
import { Note, Notebook, Section } from "api/model"
import { Skeleton } from "components/ui/skeleton"
import { useEffect, useRef, useState } from "react"
import { LuChevronDown, LuChevronRight, LuPlus, LuX } from "react-icons/lu"
import { useLocation, useParams } from "shared/Router"
import { NotebookTreeItem } from "./NotebookTreeItem"
import { useTreeExpansion } from "./useTreeExpansion"
import {
  DndContext,
  DragEndEvent,
  pointerWithin,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"

interface TreeData {
  notebook: Notebook
  sections: Array<{
    section: Section
    notes: Note[]
  }>
  unsectionedNotes: Note[]
}

export function NotebookTree() {
  const [treeData, setTreeData] = useState<TreeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState("")

  const {
    expandedNotebooks,
    expandedSections,
    toggleNotebook,
    toggleSection,
    expandNotebook,
    expandSection,
    isNotebookExpanded,
    isSectionExpanded,
    collapseAll,
    expandAll,
  } = useTreeExpansion()

  const location = useLocation()
  const { id: currentId } = useParams()

  // Track the last auto-expanded ID to prevent continuous re-expansion
  const lastAutoExpandedId = useRef<string | null>(null)

  // Configure sensors with activation constraint to allow clicks
  // Must be called before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before dragging starts
      },
    })
  )

  // Fetch all tree data
  const fetchTreeData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Fetch all notebooks
      const notebooksData = await notebooks.list()

      // 2. For each notebook, fetch sections and unsectioned notes
      const treeDataPromises = notebooksData.map(async (notebook) => {
        const [sectionsData, unsectionedNotesData] = await Promise.all([
          sections.list(notebook.id),
          sections.getUnsectioned(notebook.id),
        ])

        // 3. For each section, fetch notes
        const sectionsWithNotes = await Promise.all(
          sectionsData.map(async (section) => ({
            section,
            notes: await sections.getNotes(section.id),
          }))
        )

        return {
          notebook,
          sections: sectionsWithNotes,
          unsectionedNotes: unsectionedNotesData,
        }
      })

      const data = await Promise.all(treeDataPromises)
      setTreeData(data)
    } catch (err) {
      console.error("Error fetching tree data:", err)
      setError("Failed to load notebooks")
    } finally {
      setLoading(false)
    }
  }

  // Handle creating a new notebook
  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return

    try {
      await notebooks.create({ name: newNotebookName.trim() })
      setNewNotebookName("")
      setIsCreatingNotebook(false)
      await fetchTreeData() // Refresh tree
    } catch (err) {
      console.error("Error creating notebook:", err)
      setError("Failed to create notebook")
    }
  }

  useEffect(() => {
    fetchTreeData()
  }, [])

  // Listen for note save events to update the specific note in the tree
  useEffect(() => {
    const handleNoteSaved = (event: Event) => {
      const customEvent = event as CustomEvent<{ note: Note }>
      const updatedNote = customEvent.detail?.note

      if (!updatedNote) {
        return
      }

      // Check if the note exists in the current tree
      const noteExists = treeData.some(
        (item) =>
          item.unsectionedNotes.some((note) => note.id === updatedNote.id) ||
          item.sections.some(({ notes }) =>
            notes.some((note) => note.id === updatedNote.id)
          )
      )

      // If note doesn't exist yet (newly created), refresh the entire tree
      if (!noteExists) {
        fetchTreeData()
        return
      }

      // Otherwise, update the specific note in the tree state
      setTreeData((prevTreeData) =>
        prevTreeData.map((item) => {
          // Check if this notebook contains the note
          const noteInUnsectioned = item.unsectionedNotes.some(
            (note) => note.id === updatedNote.id
          )
          const noteInSection = item.sections.some(({ notes }) =>
            notes.some((note) => note.id === updatedNote.id)
          )

          if (!noteInUnsectioned && !noteInSection) {
            return item // Note not in this notebook, return unchanged
          }

          return {
            ...item,
            unsectionedNotes: item.unsectionedNotes.map((note) =>
              note.id === updatedNote.id ? updatedNote : note
            ),
            sections: item.sections.map(({ section, notes }) => ({
              section,
              notes: notes.map((note) =>
                note.id === updatedNote.id ? updatedNote : note
              ),
            })),
          }
        })
      )
    }

    window.addEventListener("note-saved", handleNoteSaved)
    return () => window.removeEventListener("note-saved", handleNoteSaved)
  }, [treeData])

  // Listen for specific notebook/note update events
  useEffect(() => {
    // Handle note added to notebook
    const handleNoteAddedToNotebook = async (event: Event) => {
      const customEvent = event as CustomEvent<{
        noteId: string
        notebookId: string
      }>
      const { noteId, notebookId } = customEvent.detail

      try {
        // Fetch the note data
        const note = await noteClient.fetch(noteId)

        // Add to unsectioned notes of the specified notebook
        setTreeData((prev) =>
          prev.map((item) =>
            item.notebook.id === notebookId
              ? {
                  ...item,
                  unsectionedNotes: [...item.unsectionedNotes, note],
                }
              : item
          )
        )
      } catch (err) {
        console.error("Failed to fetch note for tree update:", err)
      }
    }

    // Handle note removed from notebook
    const handleNoteRemovedFromNotebook = (event: Event) => {
      const customEvent = event as CustomEvent<{
        noteId: string
        notebookId: string
      }>
      const { noteId, notebookId } = customEvent.detail

      setTreeData((prev) =>
        prev.map((item) => {
          if (item.notebook.id !== notebookId) return item

          return {
            ...item,
            unsectionedNotes: item.unsectionedNotes.filter(
              (note) => note.id !== noteId
            ),
            sections: item.sections.map((s) => ({
              ...s,
              notes: s.notes.filter((note) => note.id !== noteId),
            })),
          }
        })
      )
    }

    // Handle note section changed
    const handleNoteSectionChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{
        noteId: string
        notebookId: string
        sectionId: string | null
      }>
      const { noteId, notebookId, sectionId } = customEvent.detail

      setTreeData((prev) =>
        prev.map((item) => {
          if (item.notebook.id !== notebookId) return item

          // Find the note in the notebook
          let noteToMove: Note | undefined

          // Check unsectioned notes
          noteToMove = item.unsectionedNotes.find((n) => n.id === noteId)

          // Check all sections
          if (!noteToMove) {
            for (const { notes } of item.sections) {
              noteToMove = notes.find((n) => n.id === noteId)
              if (noteToMove) break
            }
          }

          if (!noteToMove) return item

          // Remove note from current location
          const updatedUnsectionedNotes = item.unsectionedNotes.filter(
            (n) => n.id !== noteId
          )
          const updatedSections = item.sections.map((s) => ({
            ...s,
            notes: s.notes.filter((n) => n.id !== noteId),
          }))

          // Add note to new location
          if (sectionId === null) {
            // Move to unsectioned
            return {
              ...item,
              unsectionedNotes: [...updatedUnsectionedNotes, noteToMove],
              sections: updatedSections,
            }
          } else {
            // Move to specific section
            return {
              ...item,
              unsectionedNotes: updatedUnsectionedNotes,
              sections: updatedSections.map((s) =>
                s.section.id === sectionId
                  ? { ...s, notes: [...s.notes, noteToMove!] }
                  : s
              ),
            }
          }
        })
      )
    }

    // Handle note deleted
    const handleNoteDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ noteId: string }>
      const { noteId } = customEvent.detail

      setTreeData((prev) =>
        prev.map((item) => ({
          ...item,
          unsectionedNotes: item.unsectionedNotes.filter(
            (note) => note.id !== noteId
          ),
          sections: item.sections.map((s) => ({
            ...s,
            notes: s.notes.filter((note) => note.id !== noteId),
          })),
        }))
      )
    }

    window.addEventListener("note-added-to-notebook", handleNoteAddedToNotebook)
    window.addEventListener(
      "note-removed-from-notebook",
      handleNoteRemovedFromNotebook
    )
    window.addEventListener("note-section-changed", handleNoteSectionChanged)
    window.addEventListener("note-deleted", handleNoteDeleted)

    return () => {
      window.removeEventListener(
        "note-added-to-notebook",
        handleNoteAddedToNotebook
      )
      window.removeEventListener(
        "note-removed-from-notebook",
        handleNoteRemovedFromNotebook
      )
      window.removeEventListener(
        "note-section-changed",
        handleNoteSectionChanged
      )
      window.removeEventListener("note-deleted", handleNoteDeleted)
    }
  }, [])

  // Auto-expand to show active note (only when ID changes)
  useEffect(() => {
    if (!currentId || loading || treeData.length === 0) return

    // Only auto-expand if the ID has changed
    if (lastAutoExpandedId.current === currentId) return

    lastAutoExpandedId.current = currentId

    // If we're on a note page, find which notebook/section contains it
    if (location.pathname.startsWith("/notes/")) {
      for (const {
        notebook,
        sections: sectionsList,
        unsectionedNotes,
      } of treeData) {
        // Check unsectioned notes
        if (unsectionedNotes.some((note) => note.id === currentId)) {
          expandNotebook(notebook.id)
          return
        }

        // Check sections
        for (const { section, notes: sectionNotes } of sectionsList) {
          if (sectionNotes.some((note) => note.id === currentId)) {
            expandNotebook(notebook.id)
            expandSection(section.id)
            return
          }
        }
      }
    }

    // If we're on a notebook page, expand that notebook
    if (location.pathname.startsWith("/notebooks/")) {
      const notebookId = currentId
      if (treeData.some((item) => item.notebook.id === notebookId)) {
        expandNotebook(notebookId)
      }
    }
  }, [
    currentId,
    location.pathname,
    treeData,
    loading,
    expandNotebook,
    expandSection,
  ])

  // Loading state
  if (loading) {
    return (
      <Box px={2}>
        <Heading size="xs" mb={3} px={2} color="fg.muted">
          My Notebooks
        </Heading>
        <Stack gap={2}>
          <Skeleton height="32px" />
          <Skeleton height="32px" />
          <Skeleton height="32px" />
        </Stack>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box px={4} py={2}>
        <Heading size="xs" mb={2} color="fg.muted">
          My Notebooks
        </Heading>
        <Text fontSize="sm" color="fg.error">
          {error}
        </Text>
      </Box>
    )
  }

  // Empty state
  if (treeData.length === 0) {
    return (
      <Box px={4} py={2}>
        <Heading size="xs" mb={2} color="fg.muted">
          My Notebooks (0)
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          No notebooks yet. Create one to get started!
        </Text>
      </Box>
    )
  }

  // Calculate which notebook contains the active note
  const getActiveNotebookId = (): string | null => {
    if (!currentId) return null

    if (location.pathname.startsWith("/notes/")) {
      for (const {
        notebook,
        sections: sectionsList,
        unsectionedNotes,
      } of treeData) {
        // Check unsectioned notes
        if (unsectionedNotes.some((note) => note.id === currentId)) {
          return notebook.id
        }

        // Check sections
        for (const { notes: sectionNotes } of sectionsList) {
          if (sectionNotes.some((note) => note.id === currentId)) {
            return notebook.id
          }
        }
      }
    }

    if (location.pathname.startsWith("/notebooks/")) {
      return currentId
    }

    return null
  }

  const activeNotebookId = getActiveNotebookId()

  // Determine if all notebooks are expanded
  const allExpanded =
    treeData.length > 0 &&
    treeData.every((item) => expandedNotebooks.includes(item.notebook.id))

  // Handle collapse/expand all
  const handleToggleAll = () => {
    if (allExpanded) {
      collapseAll()
    } else {
      const notebookIds = treeData.map((item) => item.notebook.id)
      const sectionIds = treeData.flatMap((item) =>
        item.sections.map(({ section }) => section.id)
      )
      expandAll(notebookIds, sectionIds)
    }
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData || !overData) return

    // Section reordering
    if (activeData.type === "section" && overData.type === "section") {
      const notebookId = activeData.notebookId

      // Find the notebook containing these sections
      const notebookData = treeData.find(
        (item) => item.notebook.id === notebookId
      )
      if (!notebookData) return

      const sectionIds = notebookData.sections.map(({ section }) => section.id)
      const oldIndex = sectionIds.indexOf(active.id as string)
      const newIndex = sectionIds.indexOf(over.id as string)

      if (oldIndex === -1 || newIndex === -1) return

      // Optimistic update
      const newSectionIds = arrayMove(sectionIds, oldIndex, newIndex)
      setTreeData((prev) =>
        prev.map((item) =>
          item.notebook.id === notebookId
            ? {
                ...item,
                sections: newSectionIds
                  .map((id) =>
                    item.sections.find(({ section }) => section.id === id)
                  )
                  .filter(Boolean) as typeof item.sections,
              }
            : item
        )
      )

      // API call
      try {
        await sections.updatePosition(active.id as string, newIndex)
      } catch (err) {
        console.error("Failed to update section position:", err)
        await fetchTreeData() // Revert on error
      }
    }

    // Note reordering within section
    else if (activeData.type === "note" && overData.type === "note") {
      const notebookId = activeData.notebookId
      const sectionId = activeData.sectionId
      const overSectionId = overData.sectionId

      // Only handle reordering within the same section
      if (sectionId !== overSectionId) return

      const notebookData = treeData.find(
        (item) => item.notebook.id === notebookId
      )
      if (!notebookData) return

      let notes: Note[]
      let isUnsectioned = false

      if (sectionId === null) {
        // Unsectioned notes
        notes = notebookData.unsectionedNotes
        isUnsectioned = true
      } else {
        // Notes within a section
        const sectionData = notebookData.sections.find(
          ({ section }) => section.id === sectionId
        )
        if (!sectionData) return
        notes = sectionData.notes
      }

      const noteIds = notes.map((n) => n.id)
      const oldIndex = noteIds.indexOf(active.id as string)
      const newIndex = noteIds.indexOf(over.id as string)

      if (oldIndex === -1 || newIndex === -1) return

      // Optimistic update
      const newNoteIds = arrayMove(noteIds, oldIndex, newIndex)
      const reorderedNotes = newNoteIds
        .map((id) => notes.find((n) => n.id === id))
        .filter(Boolean) as Note[]

      setTreeData((prev) =>
        prev.map((item) => {
          if (item.notebook.id !== notebookId) return item

          if (isUnsectioned) {
            return {
              ...item,
              unsectionedNotes: reorderedNotes,
            }
          } else {
            return {
              ...item,
              sections: item.sections.map((s) =>
                s.section.id === sectionId ? { ...s, notes: reorderedNotes } : s
              ),
            }
          }
        })
      )

      // API call
      try {
        await sections.updateNotePosition(
          active.id as string,
          notebookId,
          newIndex
        )
      } catch (err) {
        console.error("Failed to update note position:", err)
        await fetchTreeData() // Revert on error
      }
    }

    // Note movement between sections
    else if (activeData.type === "note" && overData.type === "section") {
      const noteId = active.id as string
      const targetSectionId = over.id as string
      const notebookId = activeData.notebookId

      // API call to assign note to section
      try {
        await sections.assignNote(noteId, notebookId, targetSectionId)
        await fetchTreeData() // Refresh to show updated structure
      } catch (err) {
        console.error("Failed to move note to section:", err)
      }
    }
  }

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <Box px={2}>
        <HStack mb={3} px={2} justifyContent="space-between">
          <Heading size="xs" color="fg.muted">
            My Notebooks ({treeData.length})
          </Heading>
          <HStack gap={1}>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label={allExpanded ? "Collapse all" : "Expand all"}
              onClick={handleToggleAll}
            >
              {allExpanded ? <LuChevronRight /> : <LuChevronDown />}
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Create notebook"
              onClick={() => setIsCreatingNotebook(true)}
            >
              <LuPlus />
            </IconButton>
          </HStack>
        </HStack>

        <Stack gap={0.5}>
          {isCreatingNotebook && (
            <HStack px={2} py={1.5} gap={2}>
              <Input
                size="sm"
                placeholder="Notebook name"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateNotebook()
                  } else if (e.key === "Escape") {
                    setIsCreatingNotebook(false)
                    setNewNotebookName("")
                  }
                }}
                autoFocus
              />
              <IconButton
                size="xs"
                variant="ghost"
                aria-label="Cancel"
                onClick={() => {
                  setIsCreatingNotebook(false)
                  setNewNotebookName("")
                }}
              >
                <LuX />
              </IconButton>
            </HStack>
          )}

          {treeData.map(
            ({ notebook, sections: sectionsData, unsectionedNotes }) => (
              <NotebookTreeItem
                key={notebook.id}
                notebook={notebook}
                sections={sectionsData}
                unsectionedNotes={unsectionedNotes}
                isExpanded={isNotebookExpanded(notebook.id)}
                onToggle={() => toggleNotebook(notebook.id)}
                expandedSections={expandedSections}
                onToggleSection={toggleSection}
                containsActiveNote={activeNotebookId === notebook.id}
                currentNoteId={
                  location.pathname.startsWith("/notes/")
                    ? currentId
                    : undefined
                }
                onRefresh={fetchTreeData}
              />
            )
          )}
        </Stack>
      </Box>
    </DndContext>
  )
}
