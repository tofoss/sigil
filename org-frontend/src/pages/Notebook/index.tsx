import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  useDisclosure,
  Link as ChakraLink,
} from "@chakra-ui/react"
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
import { LuArrowLeft, LuBook, LuFolderPlus, LuTrash2 } from "react-icons/lu"
import { useFetch } from "utils/http"
import { Link, useParams, useNavigate } from "shared/Router"
import { pages } from "pages/pages"
import { useState } from "react"

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

  const { data: notebook } = useFetch(() => notebooks.get(id!), [id])
  const { data: sectionsList } = useFetch(
    () => sections.list(id!),
    [id, refreshKey]
  )
  const { data: unsectionedNotes } = useFetch(
    () => sections.getUnsectioned(id!),
    [id, refreshKey]
  )

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const sectionsArray = sectionsList || []
  const unsectionedArray = unsectionedNotes || []

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
              <Heading size="xl">{notebook.name}</Heading>
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
            <Stack gap={4}>
              {/* Unsectioned Notes */}
              {unsectionedArray.length > 0 && (
                <SectionCard
                  notebookId={id!}
                  notes={unsectionedArray}
                  isUnsectioned
                  onSuccess={handleRefresh}
                />
              )}

              {/* Sections */}
              {sectionsArray.map((section) => (
                <SectionCard
                  key={section.id}
                  section={section}
                  notebookId={id!}
                  maxPosition={maxPosition}
                  onSuccess={handleRefresh}
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
    </Container>
  )
}
