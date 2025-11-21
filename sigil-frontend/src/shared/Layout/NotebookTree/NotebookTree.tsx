import {
  Box,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react"
import { notebooks, sections } from "api"
import { Note, Notebook, Section } from "api/model"
import { Skeleton } from "components/ui/skeleton"
import { useEffect, useRef, useState } from "react"
import { LuChevronDown, LuChevronRight, LuPlus, LuX } from "react-icons/lu"
import { Link, useLocation, useParams } from "shared/Router"
import { NotebookTreeItem } from "./NotebookTreeItem"
import { NoteTreeItem } from "./NoteTreeItem"
import { useTreeExpansion } from "./useTreeExpansion"
import { pages } from "pages/pages"
import {
  DndContext,
  DragEndEvent,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { useTreeStore } from "stores/treeStore"
// eslint-disable-next-line no-restricted-imports
import dayjs from "dayjs"

// Legacy interface for NotebookTreeItem compatibility
interface TreeData {
  notebook: Notebook
  sections: Array<{
    section: Section
    notes: Note[]
  }>
  unsectionedNotes: Note[]
}

export function NotebookTree() {
  const {
    treeData: storeTreeData,
    unassignedNotes: storeUnassignedNotes,
    isLoading: loading,
    error,
    fetchTree,
  } = useTreeStore()

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
    isUnassignedExpanded,
    toggleUnassigned,
  } = useTreeExpansion()

  const location = useLocation()
  const { id: currentId } = useParams()

  // Track the last auto-expanded ID to prevent continuous re-expansion
  const lastAutoExpandedId = useRef<string | null>(null)

  // Configure sensors with activation constraint to allow clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Convert store data to legacy format for NotebookTreeItem compatibility
  const treeData: TreeData[] = storeTreeData.map((notebook) => ({
    notebook: {
      id: notebook.id,
      name: notebook.title,
      user_id: "",
      description: "",
      created_at: dayjs(),
      updated_at: dayjs(),
    } as Notebook,
    sections: notebook.sections.map((section) => ({
      section: {
        id: section.id,
        name: section.title,
        notebook_id: notebook.id,
        position: 0,
        created_at: dayjs(),
        updated_at: dayjs(),
      } as Section,
      notes: section.notes.map((note) => ({
        id: note.id,
        title: note.title,
        userId: "",
        content: "",
        createdAt: dayjs(),
        updatedAt: dayjs(),
        publishedAt: undefined,
        published: false,
        tags: [],
      })) as Note[],
    })),
    unsectionedNotes: notebook.unsectioned.map((note) => ({
      id: note.id,
      title: note.title,
      userId: "",
      content: "",
      createdAt: dayjs(),
      updatedAt: dayjs(),
      publishedAt: undefined,
      published: false,
      tags: [],
    })) as Note[],
  }))

  // Convert unassigned notes to legacy format
  const unassignedNotes: Note[] = storeUnassignedNotes.map((note) => ({
    id: note.id,
    title: note.title,
    userId: "",
    content: "",
    createdAt: dayjs(),
    updatedAt: dayjs(),
    publishedAt: undefined,
    published: false,
    tags: [],
  }))

  // Handle creating a new notebook
  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return

    try {
      await notebooks.create({ name: newNotebookName.trim() })
      setNewNotebookName("")
      setIsCreatingNotebook(false)
      await fetchTree() // Refresh tree
    } catch (err) {
      console.error("Error creating notebook:", err)
    }
  }

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

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
          <ChakraLink asChild>
            <Link to={pages.private.notebooks.path}>My Notebooks</Link>
          </ChakraLink>
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
          <ChakraLink asChild>
            <Link to={pages.private.notebooks.path}>My Notebooks</Link>
          </ChakraLink>
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
          <ChakraLink asChild>
            <Link to={pages.private.notebooks.path}>My Notebooks</Link>
          </ChakraLink>
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

      // API call
      try {
        await sections.updatePosition(active.id as string, newIndex)
        await fetchTree() // Refresh tree
      } catch (err) {
        console.error("Failed to update section position:", err)
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

      if (sectionId === null) {
        // Unsectioned notes
        notes = notebookData.unsectionedNotes
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

      // API call
      try {
        await sections.updateNotePosition(
          active.id as string,
          notebookId,
          newIndex
        )
        await fetchTree() // Refresh tree
      } catch (err) {
        console.error("Failed to update note position:", err)
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
        await fetchTree() // Refresh to show updated structure
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
            <ChakraLink asChild>
              <Link to={pages.private.notebooks.path}>
                My Notebooks ({treeData.length})
              </Link>
            </ChakraLink>
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
                onRefresh={fetchTree}
              />
            )
          )}
        </Stack>

        {/* Unassigned Notes Section */}
        {unassignedNotes.length > 0 && (
          <Box mt={4}>
            <HStack
              mb={isUnassignedExpanded ? 3 : 0}
              px={2}
              cursor="pointer"
              onClick={toggleUnassigned}
              _hover={{ bg: "gray.subtle" }}
              borderRadius="md"
              py={1.5}
            >
              <Icon
                fontSize="sm"
                color="fg.muted"
                flexShrink={0}
                transform={isUnassignedExpanded ? "rotate(90deg)" : undefined}
                transition="transform 0.15s"
              >
                <LuChevronRight />
              </Icon>
              <Heading size="xs" color="fg.muted" flex={1}>
                Unassigned Notes ({unassignedNotes.length})
              </Heading>
            </HStack>

            {isUnassignedExpanded && (
              <Stack gap={0.5}>
                {unassignedNotes.map((note) => (
                  <NoteTreeItem key={note.id} note={note} paddingLeft={8} />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </DndContext>
  )
}
