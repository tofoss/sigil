import {
  Box,
  Button,
  Container,
  DialogBackdrop,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Portal,
  Stack,
  Text,
  useDisclosure,
  Link as ChakraLink,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import {
  LuArrowLeft,
  LuBook,
  LuCheck,
  LuChevronRight,
  LuFolderPlus,
  LuPencil,
  LuTrash2,
  LuX,
} from "react-icons/lu"

import { notebooks, sections } from "api"
import { Note, Section } from "api/model"
import { NoteMoveMenu } from "components/ui/note-move-menu"
import { SectionDialog } from "components/ui/section-dialog"
import { Toaster, toaster } from "components/ui/toaster"
import { pages } from "pages/pages"
import { Link, useNavigate, useParams } from "shared/Router"
import { useTreeStore } from "stores/treeStore"
import { useFetch } from "utils/http"

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
          {notes.map((note: Note) => (
            <NoteMoveMenu
              key={note.id}
              noteId={note.id}
              sourceNotebookId={notebookId}
              sourceSectionId={section.id}
              trigger="context"
            >
              <ChakraLink asChild>
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
            </NoteMoveMenu>
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
          {notes.map((note: Note) => (
            <NoteMoveMenu
              key={note.id}
              noteId={note.id}
              sourceNotebookId={notebookId}
              sourceSectionId={null}
              trigger="context"
            >
              <ChakraLink asChild>
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
            </NoteMoveMenu>
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
  const [isRenamingNotebook, setIsRenamingNotebook] = useState(false)
  const [notebookName, setNotebookName] = useState("")
  const { deleteNotebook, renameNotebook } = useTreeStore()

  const { data: notebook } = useFetch(
    () => notebooks.get(id!),
    [id, refreshKey]
  )

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
        sectionsList.map(async (section: Section) => ({
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

  const sectionsArray = sectionsList || []
  const unsectionedArray = unsectionedNotes || []


  const handleDelete = async () => {
    if (!deleting) {
      try {
        setDeleting(true)
        await notebooks.delete(id!)

        // Update treeview via store
        deleteNotebook(id!)

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
      const trimmedName = notebookName.trim()
      await notebooks.update(id!, { name: trimmedName })
      setIsRenamingNotebook(false)

      // Update treeview via store
      renameNotebook(id!, trimmedName)

      // Refresh local notebook data
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
              {isRenamingNotebook ? (
                <>
                  <Input
                    value={notebookName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNotebookName(e.target.value)
                    }
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
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
                  <IconButton
                    variant="ghost"
                    aria-label="Rename notebook"
                    onClick={() => setIsRenamingNotebook(true)}
                    size="sm"
                  >
                    <LuPencil />
                  </IconButton>
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
            <Button variant="outline" onClick={onSectionOpen}>
              <LuFolderPlus /> New Section
            </Button>
            <Button colorScheme="red" variant="outline" onClick={onOpen}>
              <LuTrash2 /> Delete
            </Button>
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
          ) : (
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
        maxPosition={sectionsArray.length}
        onSuccess={handleRefresh}
      />

      <DialogRoot open={open} onOpenChange={onClose}>
        <Portal>
          <DialogBackdrop />
          <DialogPositioner>
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
          </DialogPositioner>
        </Portal>
      </DialogRoot>
      <Toaster />
    </Container>
  )
}
