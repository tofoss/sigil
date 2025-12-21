import { Box, Button, DialogBackdrop, DialogBody, DialogCloseTrigger, DialogContent, DialogFooter, DialogHeader, DialogPositioner, DialogRoot, DialogTitle, IconButton, Portal, useDisclosure } from "@chakra-ui/react"
import { LuX } from "react-icons/lu"
import { noteClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useEffect, useState } from "react"
import { useParams, useSearchParams, useNavigate } from "shared/Router"
import { useFetch } from "utils/http"
import { toaster } from "components/ui/toaster"
import { useTreeStore } from "stores/treeStore"
import { useTOC } from "shared/Layout"

const notePage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const shouldEdit = searchParams.get("edit") === "true"
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(shouldEdit === false)
  const { open, onOpen, onClose } = useDisclosure()
  const { deleteNote } = useTreeStore()
  const { setContent } = useTOC()

  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: note,
    loading,
  } = useFetch(() => noteClient.fetch(id), [id])

  // Set TOC content when note loads or changes
  useEffect(() => {
    setContent(note?.content || null)
    return () => setContent(null)  // Clean up when leaving page
  }, [note?.content, setContent])

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
        onModeChange={setIsPreviewMode}
      />

      {/* Delete Confirmation Dialog */}
      {open && (
        <DialogRoot open={open} onOpenChange={onClose}>
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
