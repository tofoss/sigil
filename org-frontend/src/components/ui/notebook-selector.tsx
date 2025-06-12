import {
  Box,
  Button,
  HStack,
  Text,
  Stack,
  useDisclosure,
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
import { LuBookOpen, LuPlus, LuX } from "react-icons/lu"
import { useFetch } from "utils/http"
import { useState } from "react"

interface NotebookSelectorProps {
  selectedNotebooks: Notebook[]
  onNotebooksChange: (notebooks: Notebook[]) => void
  noteId?: string
}

export function NotebookSelector({
  selectedNotebooks,
  onNotebooksChange,
  noteId,
}: NotebookSelectorProps) {
  const { data: allNotebooks = [] } = useFetch(notebooks.list)
  const { open, onOpen, onClose } = useDisclosure()
  const [working, setWorking] = useState(false)

  const handleAddNotebook = async (notebook: Notebook) => {
    if (!noteId) return

    try {
      setWorking(true)
      await notebooks.addNote(notebook.id, noteId)
      onNotebooksChange([...selectedNotebooks, notebook])
    } catch (error) {
      console.error("Error adding note to notebook:", error)
    } finally {
      setWorking(false)
    }
  }

  const handleRemoveNotebook = async (notebook: Notebook) => {
    if (!noteId) return

    try {
      setWorking(true)
      await notebooks.removeNote(notebook.id, noteId)
      onNotebooksChange(selectedNotebooks.filter((n) => n.id !== notebook.id))
    } catch (error) {
      console.error("Error removing note from notebook:", error)
    } finally {
      setWorking(false)
    }
  }

  const availableNotebooks = (allNotebooks || []).filter(
    (notebook) =>
      !selectedNotebooks.some((selected) => selected.id === notebook.id)
  )

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold">Notebooks</Text>
        {noteId && (
          <Button size="sm" onClick={onOpen} disabled={working}>
            <LuPlus /> Add to Notebook
          </Button>
        )}
      </HStack>

      {selectedNotebooks.length === 0 ? (
        <Text color="gray.500" fontSize="sm">
          This note is not in any notebooks
        </Text>
      ) : (
        <Stack gap={2}>
          {selectedNotebooks.map((notebook) => (
            <HStack
              key={notebook.id}
              p={2}
              borderWidth={1}
              borderRadius="md"
              justify="space-between"
            >
              <HStack>
                <LuBookOpen />
                <Text fontSize="sm">{notebook.name}</Text>
              </HStack>
              {noteId && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleRemoveNotebook(notebook)}
                  disabled={working}
                >
                  <LuX />
                </Button>
              )}
            </HStack>
          ))}
        </Stack>
      )}

      <DialogRoot open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note to Notebook</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {availableNotebooks.length === 0 ? (
              <Text color="gray.500">
                All available notebooks already contain this note, or no
                notebooks exist.
              </Text>
            ) : (
              <Stack gap={2}>
                {availableNotebooks.map((notebook) => (
                  <Button
                    key={notebook.id}
                    variant="outline"
                    width="100%"
                    onClick={() => {
                      handleAddNotebook(notebook)
                      onClose()
                    }}
                    disabled={working}
                  >
                    <HStack>
                      <LuBookOpen />
                      <Box textAlign="left">
                        <Text fontWeight="semibold">{notebook.name}</Text>
                        {notebook.description && (
                          <Text fontSize="sm" color="gray.600">
                            {notebook.description}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                  </Button>
                ))}
              </Stack>
            )}
          </DialogBody>
          <DialogFooter>
            <DialogCloseTrigger asChild>
              <Button variant="outline">Close</Button>
            </DialogCloseTrigger>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  )
}
