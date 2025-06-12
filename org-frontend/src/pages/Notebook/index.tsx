import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
  Card,
  useDisclosure,
  Link as ChakraLink,
} from "@chakra-ui/react"
import { notebooks } from "api"
import { Note } from "api/model"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "components/ui/dialog"
import { LuArrowLeft, LuBook, LuTrash2 } from "react-icons/lu"
import { useFetch } from "utils/http"
import { Link, useParams, useNavigate } from "shared/Router"
import { pages } from "pages/pages"
import { useState } from "react"

export function Component() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { open, onOpen, onClose } = useDisclosure()
  const [deleting, setDeleting] = useState(false)

  const { data: notebook } = useFetch(() => notebooks.get(id!), [id])
  const { data: notes = [] } = useFetch(() => notebooks.getNotes(id!), [id])

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
            <Button colorScheme="red" variant="outline" onClick={onOpen}>
              <LuTrash2 /> Delete
            </Button>
          </HStack>
        </HStack>

        <Box>
          <Heading size="lg" mb={4}>
            Table of Contents
          </Heading>
          {!notes || notes.length === 0 ? (
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
            <Stack gap={2}>
              {notes?.map((note, index) => (
                <NoteItem key={note.id} note={note} index={index + 1} />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>

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

interface NoteItemProps {
  note: Note
  index: number
}

function NoteItem({ note, index }: NoteItemProps) {
  return (
    <Card.Root _hover={{ bg: "gray.50" }} transition="background-color 0.2s">
      <Card.Body>
        <ChakraLink asChild>
          <Link to={pages.sub.note.path.replace(":id", note.id)}>
            <HStack>
              <Text fontWeight="bold" color="gray.400" minW="2rem">
                {index}.
              </Text>
              <Stack gap={1} flex={1}>
                <Text fontWeight="semibold" lineClamp={1}>
                  {note.title || "Untitled"}
                </Text>
                <HStack fontSize="sm" color="gray.500">
                  <Text>Updated {note.updatedAt.format("MMM D, YYYY")}</Text>
                  {note.tags.length > 0 && (
                    <>
                      <Text>•</Text>
                      <Text>{note.tags.map((tag) => tag.name).join(", ")}</Text>
                    </>
                  )}
                </HStack>
              </Stack>
            </HStack>
          </Link>
        </ChakraLink>
      </Card.Body>
    </Card.Root>
  )
}
