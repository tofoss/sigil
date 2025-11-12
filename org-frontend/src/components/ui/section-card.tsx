import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  Link as ChakraLink,
  useDisclosure,
} from "@chakra-ui/react"
import { sections } from "api"
import { Note, Section } from "api/model"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
} from "components/ui/dialog"
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "components/ui/menu"
import { pages } from "pages/pages"
import { useState } from "react"
import {
  LuChevronDown,
  LuChevronRight,
  LuMoreVertical,
  LuPencil,
  LuTrash2,
} from "react-icons/lu"
import { Link } from "shared/Router"
import { useFetch } from "utils/http"
import { useCollapsedSections } from "utils/use-collapsed-sections"
import { SectionDialog } from "./section-dialog"

interface SectionCardProps {
  section?: Section
  notebookId: string
  notes?: Note[]
  isUnsectioned?: boolean
  maxPosition?: number
  onSuccess?: () => void
}

export function SectionCard({
  section,
  notebookId,
  notes: providedNotes,
  isUnsectioned = false,
  maxPosition = 0,
  onSuccess,
}: SectionCardProps) {
  const sectionId = section?.id || "unsectioned"
  const { isCollapsed, toggle } = useCollapsedSections(notebookId)
  const [deleting, setDeleting] = useState(false)
  const {
    open: deleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure()
  const {
    open: editOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure()

  // Fetch notes for this section if not provided (used for regular sections)
  const { data: fetchedNotes = [] } = useFetch(
    () => (section ? sections.getNotes(section.id) : Promise.resolve([])),
    [section?.id]
  )

  const notes = providedNotes || fetchedNotes || []

  const handleDelete = async () => {
    if (section && !deleting) {
      try {
        setDeleting(true)
        await sections.delete(section.id)
        onDeleteClose()
        onSuccess?.()
      } catch (error) {
        console.error("Error deleting section:", error)
        setDeleting(false)
      }
    }
  }

  const sectionName = isUnsectioned ? "Unsectioned Notes" : section?.name || ""
  const noteCount = notes?.length || 0

  return (
    <>
      <Card.Root>
        <Card.Body>
          <Stack gap={3}>
            <HStack justify="space-between">
              <HStack
                gap={2}
                flex={1}
                cursor="pointer"
                onClick={() => toggle(sectionId)}
              >
                <Icon fontSize="xl" color="fg.muted">
                  {!isCollapsed(sectionId) ? (
                    <LuChevronDown />
                  ) : (
                    <LuChevronRight />
                  )}
                </Icon>
                <Heading size="md">{sectionName}</Heading>
                <Text fontSize="sm" color="fg.muted">
                  ({noteCount} {noteCount === 1 ? "note" : "notes"})
                </Text>
              </HStack>

              {!isUnsectioned && section && (
                <MenuRoot>
                  <MenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Icon>
                        <LuMoreVertical />
                      </Icon>
                    </Button>
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem value="edit" onClick={onEditOpen}>
                      <Icon>
                        <LuPencil />
                      </Icon>
                      Edit Name
                    </MenuItem>
                    <MenuItem
                      value="delete"
                      onClick={onDeleteOpen}
                      color="fg.error"
                    >
                      <Icon>
                        <LuTrash2 />
                      </Icon>
                      Delete Section
                    </MenuItem>
                  </MenuContent>
                </MenuRoot>
              )}
            </HStack>

            {!isCollapsed(sectionId) && (
              <Box pl={8}>
                {!notes || notes.length === 0 ? (
                  <Box
                    p={4}
                    textAlign="center"
                    borderWidth={1}
                    borderRadius="md"
                    borderStyle="dashed"
                  >
                    <Text color="fg.muted" fontSize="sm">
                      No notes in this section
                    </Text>
                  </Box>
                ) : (
                  <Stack gap={1}>
                    {notes?.map((note, index) => (
                      <HStack
                        key={note.id}
                        p={2}
                        borderRadius="md"
                        _hover={{ bg: "bg.muted" }}
                        asChild
                      >
                        <ChakraLink asChild>
                          <Link to={`/notes/${note.id}`}>
                            <Text fontSize="sm" color="fg.muted" minW="6">
                              {index + 1}.
                            </Text>
                            <Text flex={1}>{note.title || "Untitled"}</Text>
                          </Link>
                        </ChakraLink>
                      </HStack>
                    ))}
                  </Stack>
                )}
              </Box>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>

      {/* Edit Dialog */}
      {section && (
        <SectionDialog
          open={editOpen}
          onClose={onEditClose}
          notebookId={notebookId}
          section={section}
          maxPosition={maxPosition}
          onSuccess={onSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={deleteOpen} onOpenChange={onDeleteClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text>
              Are you sure you want to delete "{sectionName}"?
              {noteCount > 0 && (
                <>
                  {" "}
                  This section contains {noteCount}{" "}
                  {noteCount === 1 ? "note" : "notes"}. These notes will remain
                  in the notebook but become unsectioned.
                </>
              )}
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
    </>
  )
}
