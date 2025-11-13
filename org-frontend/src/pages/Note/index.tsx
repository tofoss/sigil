import { Box } from "@chakra-ui/react"
import { noteClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useParams, useSearchParams } from "shared/Router"
import { useFetch } from "utils/http"

const notePage = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const shouldEdit = searchParams.get("edit") === "true"

  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: note,
    loading,
    error,
  } = useFetch(() => noteClient.fetch(id), [id])

  if (loading) {
    return <Skeleton />
  }

  if (!note) {
    return <ErrorBoundary />
  }

  return (
    <Box width="100%">
      <Editor note={note} mode={shouldEdit ? "Edit" : "Display"} />
    </Box>
  )
}

export const Component = notePage

export const ErrorBoundary = () => {
  return <p>500</p>
}
