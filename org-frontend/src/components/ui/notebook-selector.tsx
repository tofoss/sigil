import {
  Box,
  Button,
  HStack,
  Text,
  Stack,
  useDisclosure,
  VStack,
  createListCollection,
} from "@chakra-ui/react"
import { notebooks, sections } from "api"
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
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "components/ui/select"
import { LuBookOpen, LuPlus, LuX, LuFolderTree } from "react-icons/lu"
import { useFetch } from "utils/http"
import { useState } from "react"

interface NotebookSelectorProps {
  selectedNotebooks: Notebook[]
  onNotebooksChange: (notebooks: Notebook[]) => void
  noteId?: string
}

interface NotebookSectionSelectorProps {
  notebook: Notebook
  noteId: string
  onSectionChange: (notebookId: string, sectionId: string | null) => void
}

function NotebookSectionSelector({
  notebook,
  noteId,
  onSectionChange,
}: NotebookSectionSelectorProps) {
  const { data: sectionsList = [] } = useFetch(
    () => sections.list(notebook.id),
    [notebook.id]
  )
  const [updating, setUpdating] = useState(false)

  const handleChange = async (details: { value: string[] }) => {
    const value = details.value[0]
    const newSectionId = value === "" ? null : value

    try {
      setUpdating(true)
      await sections.assignNote(noteId, notebook.id, newSectionId)
      onSectionChange(notebook.id, newSectionId)

      // Dispatch event to update notebook tree
      window.dispatchEvent(new CustomEvent("notebook-updated"))
    } catch (error) {
      console.error("Error assigning note to section:", error)
    } finally {
      setUpdating(false)
    }
  }

  const items = createListCollection({
    items: [
      { label: "Unsectioned", value: "" },
      ...(sectionsList || []).map((section) => ({
        label: section.name,
        value: section.id,
      })),
    ],
  })

  return (
    <HStack width="100%" mt={1}>
      <LuFolderTree size={14} style={{ marginLeft: "8px" }} />
      <SelectRoot
        collection={items}
        size="xs"
        width="100%"
        value={[notebook.section_id || ""]}
        onValueChange={handleChange}
        disabled={updating}
      >
        <SelectTrigger>
          <SelectValueText placeholder="Select section" />
        </SelectTrigger>
        <SelectContent>
          {items.items.map((item: { label: string; value: string }) => (
            <SelectItem item={item} key={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </HStack>
  )
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

      // Dispatch event to update notebook tree
      window.dispatchEvent(new CustomEvent("notebook-updated"))
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

      // Dispatch event to update notebook tree
      window.dispatchEvent(new CustomEvent("notebook-updated"))
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
            <VStack
              key={notebook.id}
              p={2}
              borderWidth={1}
              borderRadius="md"
              align="stretch"
              gap={0}
            >
              <HStack justify="space-between">
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
              {noteId && (
                <NotebookSectionSelector
                  notebook={notebook}
                  noteId={noteId}
                  onSectionChange={(notebookId, sectionId) => {
                    // Update the local state to reflect the change
                    onNotebooksChange(
                      selectedNotebooks.map((nb) =>
                        nb.id === notebookId
                          ? { ...nb, section_id: sectionId || undefined }
                          : nb
                      )
                    )
                  }}
                />
              )}
            </VStack>
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
