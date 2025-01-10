import { Box } from "@chakra-ui/react"
import { Editor } from "modules/editor"

const HomePage = () => {
  return (
    <Box width="100%">
      <Editor />
    </Box>
  )
}

export const Component = HomePage

export const ErrorBoundary = () => {
  return <p>500</p>
}
