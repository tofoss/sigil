import { Box, Button, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogPositioner, DialogRoot, DialogTitle, IconButton, Portal, useDisclosure } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"
import { shoppingListClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useState } from "react"
import { useParams, useSearchParams, useNavigate } from "shared/Router"
import { useFetch } from "utils/http"
import { toaster } from "components/ui/toaster"
import { useShoppingListStore } from "stores/shoppingListStore"

const shoppingListPage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const shouldEdit = searchParams.get("edit") === "true"
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(shouldEdit === false)
  const { open, onOpen, onClose } = useDisclosure()
  const { deleteShoppingList } = useShoppingListStore()

  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: shoppingList,
    loading,
  } = useFetch(() => shoppingListClient.get(id), [id])

  const handleDeleteClick = () => {
    onOpen()
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    onClose()
    try {
      await shoppingListClient.delete(id)

      // Remove from sidebar tree via store
      deleteShoppingList(id)

      toaster.create({
        title: "Shopping list deleted successfully",
        type: "success",
      })
      navigate("/")
    } catch (err) {
      console.error("Failed to delete shopping list:", err)
      toaster.create({
        title: "Failed to delete shopping list",
        description: "Please try again",
        type: "error",
      })
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <Skeleton />
  }

  if (!shoppingList) {
    return <ErrorBoundary />
  }

  return (
    <Box width="100%" maxWidth="100%" minWidth="0">
      <Editor
        shoppingList={shoppingList}
        mode={shouldEdit ? "Edit" : "Display"}
        onDelete={handleDeleteClick}
        onModeChange={setIsPreviewMode}
      />

      {/* Delete Confirmation Dialog - Only mount when open */}
      {open && (
        <DialogRoot open={true} onOpenChange={onClose}>
          <Portal>
            <DialogBackdrop />
            <DialogPositioner>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Shopping List</DialogTitle>
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
                  Are you sure you want to delete this shopping list? This action cannot be
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

export const Component = shoppingListPage

export const ErrorBoundary = () => {
  return <p>500</p>
}
