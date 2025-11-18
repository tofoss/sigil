import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
  useDisclosure,
  Link as ChakraLink,
} from "@chakra-ui/react"
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { notebooks, sections } from "api"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "components/ui/dialog"
import { SectionCard } from "components/ui/section-card"
import { SectionDialog } from "components/ui/section-dialog"
import { SortableSectionCard } from "components/ui/sortable-section-card"
import { Toaster, toaster } from "components/ui/toaster"
import {
  LuArrowLeft,
  LuBook,
  LuFolderPlus,
  LuTrash2,
  LuPencil,
  LuCheck,
  LuChevronRight,
  LuX,
} from "react-icons/lu"
import { useFetch } from "utils/http"
import { Link, useParams, useNavigate } from "shared/Router"
import { pages } from "pages/pages"
import { useState, useEffect } from "react"
import { Note, Section } from "api/model"

interface SimpleSectionProps {
  section: Section
  notes: Note[]
  notebookId: string
}

function SimpleSection({ section, notes, notebookId }: SimpleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <Box>
      <HStack
        px={3}
        py={2}
        bg="gray.50"
        _dark={{ bg: "gray.800" }}
        borderRadius="md"
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          transform={isExpanded ? "rotate(90deg)" : undefined}
          transition="transform 0.15s"
        >
          <LuChevronRight />
        </Icon>
        <Heading size="sm" flex={1}>
          {section.name}
        </Heading>
        <Text fontSize="xs" color="fg.muted">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </Text>
      </HStack>
      {isExpanded && notes.length > 0 && (
        <Stack gap={1} mt={2} ml={6}>
          {notes.map((note) => (
            <ChakraLink asChild key={note.id}>
              <Link to={`/notes/${note.id}`}>
                <Box
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  _hover={{ bg: "gray.100", _dark: { bg: "gray.800" } }}
                >
                  <Text fontSize="sm">{note.title || "Untitled"}</Text>
                </Box>
              </Link>
            </ChakraLink>
          ))}
        </Stack>
      )}
    </Box>
  )
}

interface SimpleUnsectionedProps {
  notes: Note[]
  notebookId: string
}

function SimpleUnsectioned({ notes, notebookId }: SimpleUnsectionedProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (notes.length === 0) return null

  return (
    <Box>
      <HStack
        px={3}
        py={2}
        bg="gray.50"
        _dark={{ bg: "gray.800" }}
        borderRadius="md"
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        _hover={{ bg: "gray.100", _dark: { bg: "gray.700" } }}
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          transform={isExpanded ? "rotate(90deg)" : undefined}
          transition="transform 0.15s"
        >
          <LuChevronRight />
        </Icon>
        <Heading size="sm" flex={1} fontStyle="italic" color="fg.muted">
          Unsectioned
        </Heading>
        <Text fontSize="xs" color="fg.muted">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </Text>
      </HStack>
      {isExpanded && (
        <Stack gap={1} mt={2} ml={6}>
          {notes.map((note) => (
            <ChakraLink asChild key={note.id}>
              <Link to={`/notes/${note.id}`}>
                <Box
                  px={3}
                  py={1.5}
                  borderRadius="md"
                  _hover={{ bg: "gray.100", _dark: { bg: "gray.800" } }}
                >
                  <Text fontSize="sm">{note.title || "Untitled"}</Text>
                </Box>
              </Link>
            </ChakraLink>
          ))}
        </Stack>
      )}
    </Box>
  )
}

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { open, onOpen, onClose } = useDisclosure()
  const {
    open: sectionOpen,
    onOpen: onSectionOpen,
    onClose: onSectionClose,
  } = useDisclosure()
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isRenamingNotebook, setIsRenamingNotebook] = useState(false)
  const [notebookName, setNotebookName] = useState("")

  const { data: notebook } = useFetch(() => notebooks.get(id!), [id])

  // Update local notebook name when notebook data changes
  useEffect(() => {
    if (notebook) {
      setNotebookName(notebook.name)
    }
  }, [notebook])
  const { data: sectionsList } = useFetch(
    () => sections.list(id!),
    [id, refreshKey]
  )
  const { data: unsectionedNotes } = useFetch(
    () => sections.getUnsectioned(id!),
    [id, refreshKey]
  )

  // Fetch notes for each section
  const [sectionsWithNotes, setSectionsWithNotes] = useState<
    Array<{ section: Section; notes: Note[] }>
  >([])

  useEffect(() => {
    if (!sectionsList) return

    const fetchAllNotes = async () => {
      const results = await Promise.all(
        sectionsList.map(async (section) => ({
          section,
          notes: await sections.getNotes(section.id),
        }))
      )
      setSectionsWithNotes(results)
    }

    fetchAllNotes()
  }, [sectionsList, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      return
    }

    const dragData = active.data.current
    const dropData = over.data.current

    // Handle section reordering
    if (dragData?.type === "section-sort") {
      // This is a section drag
      if (active.id === over.id) {
        return
      }

      const oldIndex = optimisticSections.findIndex((s) => s.id === active.id)
      const newIndex = optimisticSections.findIndex((s) => s.id === over.id)

      if (oldIndex === -1 || newIndex === -1) {
        return
      }

      // Optimistically reorder
      const reordered = arrayMove(optimisticSections, oldIndex, newIndex)
      setOptimisticSections(reordered)

      try {
        // Call API with new position (0-based index)
        await sections.updatePosition(active.id as string, newIndex)

        toaster.create({
          title: "Section reordered",
          type: "success",
          duration: 2000,
        })

        // Refresh to ensure consistency with server
        handleRefresh()
      } catch (error) {
        console.error("Error reordering section:", error)

        // Rollback optimistic update
        setOptimisticSections(sectionsArray)

        toaster.create({
          title: "Failed to reorder section",
          description: "Please try again",
          type: "error",
          duration: 3000,
        })
      }
      return
    }

    // Handle note dragging to sections
    if (dragData?.type === "note" && dropData?.type === "section") {
      const noteId = active.id as string
      const currentSectionId = dragData.currentSectionId
      const targetSectionId = dropData.sectionId

      // No change if dropping in same section
      if (currentSectionId === targetSectionId) {
        return
      }

      try {
        // Call API to reassign note to new section
        await sections.assignNote(noteId, id!, targetSectionId)

        toaster.create({
          title: "Note moved",
          type: "success",
          duration: 2000,
        })

        // Refresh to get updated note lists
        handleRefresh()
      } catch (error) {
        console.error("Error moving note:", error)

        toaster.create({
          title: "Failed to move note",
          description: "Please try again",
          type: "error",
          duration: 3000,
        })
      }
    }
  }

  const sectionsArray = sectionsList || []
  const unsectionedArray = unsectionedNotes || []

  // Optimistic state for drag-and-drop
  const [optimisticSections, setOptimisticSections] = useState(sectionsArray)

  // Sync optimistic state when real data changes
  useEffect(() => {
    setOptimisticSections(sectionsArray)
  }, [sectionsList])

  const maxPosition =
    sectionsArray.length > 0
      ? Math.max(...sectionsArray.map((s) => s.position))
      : -1

  const handleDelete = async () => {
    if (!deleting) {
      try {
        setDeleting(true)
        await notebooks.delete(id!)
        navigate(pages.private.notebooks.path)
      } catch (error) {
        console.error("Error deleting notebook:", error)
        setDeleting(false)
      }
    }
  }

  const handleRenameNotebook = async () => {
    if (!notebookName.trim() || notebookName.trim() === notebook?.name) {
      setIsRenamingNotebook(false)
      setNotebookName(notebook?.name || "")
      return
    }

    try {
      await notebooks.update(id!, { name: notebookName.trim() })
      setIsRenamingNotebook(false)
      setRefreshKey((prev) => prev + 1)
      toaster.create({
        title: "Notebook renamed",
        type: "success",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error renaming notebook:", error)
      setNotebookName(notebook?.name || "")
      setIsRenamingNotebook(false)
      toaster.create({
        title: "Failed to rename notebook",
        type: "error",
        duration: 3000,
      })
    }
  }

  const handleCancelRename = () => {
    setIsRenamingNotebook(false)
    setNotebookName(notebook?.name || "")
  }

  if (!notebook) {
    return (
      <Container maxW="4xl" py={8}>
        <Text>Loading...</Text>
      </Container>
    )
  }

  return (
    <Container maxW="4xl" py={8}>
      <Stack gap={6}>
        <HStack>
          <ChakraLink asChild>
            <Link to={pages.private.notebooks.path}>
              <Button variant="ghost">
                <LuArrowLeft /> Back to Notebooks
              </Button>
            </Link>
          </ChakraLink>
        </HStack>

        <HStack justify="space-between" align="start">
          <Stack gap={2}>
            <HStack>
              <Icon fontSize="2xl">
                <LuBook />
              </Icon>
              {isEditMode && isRenamingNotebook ? (
                <>
                  <Input
                    value={notebookName}
                    onChange={(e) => setNotebookName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameNotebook()
                      } else if (e.key === "Escape") {
                        handleCancelRename()
                      }
                    }}
                    size="lg"
                    autoFocus
                  />
                  <IconButton
                    variant="ghost"
                    aria-label="Save"
                    onClick={handleRenameNotebook}
                  >
                    <LuCheck />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    aria-label="Cancel"
                    onClick={handleCancelRename}
                  >
                    <LuX />
                  </IconButton>
                </>
              ) : (
                <>
                  <Heading size="xl">{notebook.name}</Heading>
                  {isEditMode && (
                    <IconButton
                      variant="ghost"
                      aria-label="Rename notebook"
                      onClick={() => setIsRenamingNotebook(true)}
                      size="sm"
                    >
                      <LuPencil />
                    </IconButton>
                  )}
                </>
              )}
            </HStack>
            {notebook.description && (
              <Text color="gray.600" fontSize="lg">
                {notebook.description}
              </Text>
            )}
            <Text fontSize="sm" color="gray.400">
              Created {notebook.created_at.format("MMM D, YYYY")} • Updated{" "}
              {notebook.updated_at.format("MMM D, YYYY")}
            </Text>
          </Stack>

          <HStack>
            <Button
              variant="outline"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <>
                  <LuCheck /> Done
                </>
              ) : (
                <>
                  <LuPencil /> Edit
                </>
              )}
            </Button>
            {isEditMode && (
              <>
                <Button variant="outline" onClick={onSectionOpen}>
                  <LuFolderPlus /> New Section
                </Button>
                <Button colorScheme="red" variant="outline" onClick={onOpen}>
                  <LuTrash2 /> Delete
                </Button>
              </>
            )}
          </HStack>
        </HStack>

        <Box>
          <Heading size="lg" mb={4}>
            Table of Contents
          </Heading>
          {sectionsArray.length === 0 && unsectionedArray.length === 0 ? (
            <Box
              p={8}
              textAlign="center"
              borderWidth={1}
              borderRadius="lg"
              borderStyle="dashed"
            >
              <Text color="gray.500">
                This notebook is empty. Add some notes to get started!
              </Text>
            </Box>
          ) : isEditMode ? (
            // Edit Mode: Drag-and-drop interface
            <DndContext
              collisionDetection={pointerWithin}
              onDragEnd={handleDragEnd}
            >
              <Stack gap={4}>
                {/* Unsectioned Notes */}
                {unsectionedArray.length > 0 && (
                  <SectionCard
                    notebookId={id!}
                    notes={unsectionedArray}
                    isUnsectioned
                    onSuccess={handleRefresh}
                    refreshKey={refreshKey}
                  />
                )}

                {/* Sections with Drag-and-Drop */}
                <SortableContext
                  items={optimisticSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {optimisticSections.map((section) => (
                    <SortableSectionCard
                      key={section.id}
                      section={section}
                      notebookId={id!}
                      maxPosition={maxPosition}
                      onSuccess={handleRefresh}
                      refreshKey={refreshKey}
                    />
                  ))}
                </SortableContext>
              </Stack>
            </DndContext>
          ) : (
            // Read-only Mode: Simple TOC view
            <Stack gap={3}>
              {/* Unsectioned Notes */}
              <SimpleUnsectioned notes={unsectionedArray} notebookId={id!} />

              {/* Sections */}
              {sectionsWithNotes.map(({ section, notes }) => (
                <SimpleSection
                  key={section.id}
                  section={section}
                  notes={notes}
                  notebookId={id!}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>

      {/* Create Section Dialog */}
      <SectionDialog
        open={sectionOpen}
        onClose={onSectionClose}
        notebookId={id!}
        maxPosition={maxPosition}
        onSuccess={handleRefresh}
      />

      <DialogRoot open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Notebook</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>
              Are you sure you want to delete "{notebook.name}"? This action
              cannot be undone. The notes will not be deleted, but they will be
              removed from this notebook.
            </Text>
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogCloseTrigger>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
      <Toaster />
    </Container>
  )
}
