import { Box } from "@chakra-ui/react"
import { Editor } from "modules/editor"

const NewPage = () => {
  return (
    <Box width="100%">
      <Editor />
    </Box>
  )
}

export const Component = NewPage

export const ErrorBoundary = () => {
  return <p>500</p>
}
