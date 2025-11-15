import { Box } from "@chakra-ui/react"
import { noteClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useState } from "react"
import { useParams, useSearchParams, useNavigate } from "shared/Router"
import { useFetch } from "utils/http"
import { toaster } from "components/ui/toaster"

const notePage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const shouldEdit = searchParams.get("edit") === "true"
  const [isDeleting, setIsDeleting] = useState(false)

  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: note,
    loading,
    error,
  } = useFetch(() => noteClient.fetch(id), [id])

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return
    }

    setIsDeleting(true)
    try {
      await noteClient.delete(id)

      // Dispatch event to update notebook tree
      window.dispatchEvent(
        new CustomEvent("note-deleted", {
          detail: { noteId: id },
        })
      )

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
    <Box width="100%">
      <Editor
        note={note}
        mode={shouldEdit ? "Edit" : "Display"}
        onDelete={handleDelete}
      />
    </Box>
  )
}

export const Component = notePage

export const ErrorBoundary = () => {
  return <p>500</p>
}
