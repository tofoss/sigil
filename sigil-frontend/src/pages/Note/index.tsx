import { Box, Button, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogPositioner, DialogRoot, DialogTitle, IconButton, Portal, useDisclosure } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"
import { noteClient, shoppingListClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useEffect, useState } from "react"
import { useParams, useSearchParams, useNavigate } from "shared/Router"
import { useFetch } from "utils/http"
import { toaster } from "components/ui/toaster"
import { useTreeStore } from "stores/treeStore"
import { useShoppingListStore } from "stores/shoppingListStore"
import { useTOC } from "shared/Layout"

const notePage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const shouldEdit = searchParams.get("edit") === "true"
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(shouldEdit === false)
  const { open: deleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { deleteNote } = useTreeStore()
  const { addShoppingList } = useShoppingListStore()
  const { setContent } = useTOC()

  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: note,
    loading,
  } = useFetch(() => noteClient.fetch(id), [id])

  // Fetch shopping lists to check if there's a previous one
  const { data: shoppingLists } = useFetch(
    () => shoppingListClient.list(),
    []
  )
  const lastShoppingList = shoppingLists && shoppingLists.length > 0 ? shoppingLists[0] : null

  // Set TOC content when note loads or changes
  useEffect(() => {
    setContent(note?.content || null)
    return () => setContent(null)  // Clean up when leaving page
  }, [note?.content, setContent])

  const handleDeleteClick = () => {
    onDeleteOpen()
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    onDeleteClose()
    try {
      await noteClient.delete(id)

      // Update notebook tree via store
      deleteNote(id)

      toaster.create({
        title: "Note deleted successfully",
        type: "success",
      })
      navigate("/")
    } catch (err) {
      console.error("Failed to delete note:", err)
      toaster.create({
        title: "Failed to delete note",
        description: "Please try again",
        type: "error",
      })
      setIsDeleting(false)
    }
  }

  const handleConvert = async (mode: "new" | "merge") => {
    if (isConverting) return

    setIsConverting(true)
    try {
      const shoppingList = await noteClient.convertToShoppingList(id, mode)

      if (mode === "new") {
        // Add to sidebar tree via store
        addShoppingList({ id: shoppingList.id, title: shoppingList.title })
      }

      toaster.create({
        title: mode === "new"
          ? "Shopping list created successfully"
          : "Items added to shopping list",
        type: "success",
      })
      // Navigate to the shopping list in edit mode
      navigate(`/shopping-lists/${shoppingList.id}?edit=true`)
    } catch (err) {
      console.error("Failed to convert note:", err)
      toaster.create({
        title: "Failed to convert note",
        description: "Please try again",
        type: "error",
      })
      setIsConverting(false)
    }
  }

  if (loading) {
    return <Skeleton />
  }

  if (!note) {
    return <ErrorBoundary />
  }

  return (
    <Box width="100%" maxWidth="100%" minWidth="0">
      <Editor
        note={note}
        mode={shouldEdit ? "Edit" : "Display"}
        onDelete={handleDeleteClick}
        onModeChange={setIsPreviewMode}
        onConvert={handleConvert}
        hasLastShoppingList={!!lastShoppingList}
        isConverting={isConverting}
      />

      {/* Delete Confirmation Dialog - Only mount when open */}
      {deleteOpen && (
        <DialogRoot open={true} onOpenChange={onDeleteClose}>
          <Portal>
            <DialogBackdrop />
            <DialogPositioner>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Note</DialogTitle>
                </DialogHeader>
                <DialogCloseTrigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Close"
                    position="absolute"
                    top="2"
                    right="2"
                  >
                    <LuX />
                  </IconButton>
                </DialogCloseTrigger>
                <DialogBody>
                  Are you sure you want to delete this note? This action cannot be
                  undone.
                </DialogBody>
                <DialogFooter>
                  <Button
                    colorPalette="red"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </DialogPositioner>
          </Portal>
        </DialogRoot>
      )}
    </Box>
  )
}

export const Component = notePage

export const ErrorBoundary = () => {
  return <p>500</p>
}
