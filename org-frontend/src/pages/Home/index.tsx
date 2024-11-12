import { Box } from "@chakra-ui/react"
import { Editor } from "modules/editor"
import { useRouteError } from "shared/Router"

const HomePage = () => {
  return (
    <Box width="100%">
      <Editor />
    </Box>
  )
}

export const Component = HomePage

export const ErrorBoundary = () => {
  const error = useRouteError()

  if (error.status === 404) {
    return <p>404</p>
  }

  return <p>500</p>
}
