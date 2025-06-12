import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  Stack,
  useDisclosure,
  Link as ChakraLink,
} from "@chakra-ui/react"
import { notebooks } from "api"
import { Notebook } from "api/model"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "components/ui/dialog"
import { Field } from "components/ui/field"
import { LuPlus } from "react-icons/lu"
import { useFetch } from "utils/http"
import { useState } from "react"
import { Link } from "shared/Router"
import { pages } from "pages/pages"

export function Component() {
  const { data: notebookList = [], loading } = useFetch(notebooks.list)
  const { open, onOpen, onClose } = useDisclosure()
  const [newNotebook, setNewNotebook] = useState({ name: "", description: "" })
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (newNotebook.name.trim() && !creating) {
      try {
        setCreating(true)
        await notebooks.create(newNotebook)
        onClose()
        setNewNotebook({ name: "", description: "" })
        window.location.reload() // Simple refresh for now
      } catch (error) {
        console.error("Error creating notebook:", error)
      } finally {
        setCreating(false)
      }
    }
  }

  return (
    <Container maxW="6xl" py={8}>
      <Stack gap={6}>
        <HStack justify="space-between">
          <Heading size="xl">Notebooks</Heading>
          <Button onClick={onOpen}>
            <LuPlus /> New Notebook
          </Button>
        </HStack>

        {loading ? (
          <Text>Loading...</Text>
        ) : !notebookList || notebookList.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text fontSize="lg" color="gray.500">
              No notebooks yet. Create your first notebook to get started!
            </Text>
          </Box>
        ) : (
          <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
            {notebookList?.map((notebook) => (
              <NotebookCard key={notebook.id} notebook={notebook} />
            ))}
          </Grid>
        )}
      </Stack>

      <DialogRoot open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Notebook</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Field label="Name" required>
                <Input
                  value={newNotebook.name}
                  onChange={(e) =>
                    setNewNotebook({ ...newNotebook, name: e.target.value })
                  }
                  placeholder="Enter notebook name"
                />
              </Field>
              <Field label="Description">
                <Input
                  value={newNotebook.description}
                  onChange={(e) =>
                    setNewNotebook({
                      ...newNotebook,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter notebook description (optional)"
                />
              </Field>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant="outline">Cancel</Button>
            </DialogCloseTrigger>
            <Button
              onClick={handleCreate}
              disabled={!newNotebook.name.trim() || creating}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Container>
  )
}

interface NotebookCardProps {
  notebook: Notebook
}

function NotebookCard({ notebook }: NotebookCardProps) {
  return (
    <Card.Root
      _hover={{ shadow: "md", transform: "translateY(-2px)" }}
      transition="all 0.2s"
    >
      <Card.Body>
        <ChakraLink asChild>
          <Link to={pages.sub.notebook.path.replace(":id", notebook.id)}>
            <Stack gap={3}>
              <Heading size="md" lineClamp={2}>
                {notebook.name}
              </Heading>
              {notebook.description && (
                <Text color="gray.600" lineClamp={3}>
                  {notebook.description}
                </Text>
              )}
              <Text fontSize="sm" color="gray.400">
                Updated {notebook.updated_at.format("MMM D, YYYY")}
              </Text>
            </Stack>
          </Link>
        </ChakraLink>
      </Card.Body>
    </Card.Root>
  )
}
