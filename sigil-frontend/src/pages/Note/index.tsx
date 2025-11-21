import { Box, Button, IconButton, useDisclosure } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"
import { noteClient } from "api"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from "components/ui/dialog"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useState } from "react"
import { useParams, useSearchParams, useNavigate } from "shared/Router"
import { useFetch } from "utils/http"
import { toaster } from "components/ui/toaster"
import { useTreeStore } from "stores/treeStore"

const notePage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const shouldEdit = searchParams.get("edit") === "true"
  const [isDeleting, setIsDeleting] = useState(false)
  const { open, onOpen, onClose } = useDisclosure()
  const { deleteNote } = useTreeStore()

  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: note,
    loading,
    error,
  } = useFetch(() => noteClient.fetch(id), [id])

  const handleDeleteClick = () => {
    onOpen()
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    onClose()
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
      />

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={open} onOpenChange={onClose}>
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
      </DialogRoot>
    </Box>
  )
}

export const Component = notePage

export const ErrorBoundary = () => {
  return <p>500</p>
}
