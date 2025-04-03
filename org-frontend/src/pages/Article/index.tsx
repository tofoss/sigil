import { Box } from "@chakra-ui/react"
import { articleClient } from "api"
import { Skeleton } from "components/ui/skeleton"
import { Editor } from "modules/editor"
import { useParams } from "shared/Router"
import { useFetch } from "utils/http"

const ArticlePage = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) {
    return <ErrorBoundary />
  }

  const {
    data: article,
    loading,
    error,
  } = useFetch(() => articleClient.fetch(id))

  if (loading) {
    return <Skeleton />
  }

  if (!article) {
    return <ErrorBoundary />
  }

  return (
    <Box width="100%">
      <Editor article={article} mode="Display" />
    </Box>
  )
}

export const Component = ArticlePage

export const ErrorBoundary = () => {
  return <p>500</p>
}
