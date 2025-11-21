import { Box } from "@chakra-ui/react"
import { Outlet } from "shared/Router"

export function PublicLayout() {
  return (
    <Box as="main" width="100%">
      <Outlet />
    </Box>
  )
}
