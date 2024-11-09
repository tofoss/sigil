import { Box } from "@chakra-ui/react"
import { Outlet } from "shared/Router"

export function Layout() {
  return (
    <Box bg={"bg.subtle"} height={"100%"}>
      <Outlet />
    </Box>
  )
}
