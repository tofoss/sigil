import {
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  VStack,
  Menu,
  Portal,
} from "@chakra-ui/react"
import { Avatar } from "components/ui/avatar"
import { Link, Outlet, useNavigate } from "shared/Router"
import { FiMenu } from "react-icons/fi"
import {
  LuLogOut,
  LuPlus,
  LuFileText,
  LuChefHat,
  LuBookOpen,
  LuChevronDown,
} from "react-icons/lu"
import { colorPalette } from "theme"
import { ColorModeButton } from "components/ui/color-mode"
import { toaster } from "components/ui/toaster"

import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "components/ui/drawer"
import { NotebookTree } from "./NotebookTree"
import { SearchInput } from "components/SearchInput"
import { useFetch } from "utils/http"
import { userClient } from "api/users"
import { pages } from "pages/pages"

export function Layout() {
  const { data: authStatus } = useFetch(async () => userClient.status())
  const navigate = useNavigate()

  if (authStatus !== null && !authStatus.loggedIn) {
    navigate("/login")
  }

  const handleLogout = async () => {
    try {
      await userClient.logout()
      toaster.create({
        title: "Logged out successfully",
        type: "success",
      })
      navigate("/login")
    } catch (err) {
      console.error("Logout failed:", err)
      toaster.create({
        title: "Logout failed",
        description: "Please try again",
        type: "error",
      })
    }
  }

  return (
    <Flex justifyContent="center">
      <VStack
        bg="bg.subtle"
        height="100%"
        maxWidth="1080px"
        width="100%"
        p="0"
        alignItems="start"
      >
        <HStack width="inherit" p="0.25rem" pl="0.5rem" pr="0.5rem">
          <DrawerRoot placement="start">
            <DrawerBackdrop />
            <DrawerTrigger asChild>
              <IconButton
                hideFrom="lg"
                variant="outline"
                border="0"
                colorPalette={colorPalette}
              >
                <FiMenu />
              </IconButton>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>org</DrawerTitle>
              </DrawerHeader>
              <DrawerBody>
                <Box mb="4">
                  <SearchInput />
                </Box>
                <Box overflowX="hidden" pr={2}>
                  <NotebookTree />
                </Box>
              </DrawerBody>
              <DrawerCloseTrigger />
            </DrawerContent>
          </DrawerRoot>
          <Text fontSize="2xl" fontWeight="extrabold">
            <Link to={pages.private.home.path}>org</Link>
          </Text>
          <Box flex="1" />
          <HStack ml="auto" gap="2">
            <Menu.Root positioning={{ placement: "bottom-end" }}>
              <Menu.Trigger asChild>
                <IconButton
                  variant="outline"
                  colorPalette={colorPalette}
                  title="Create new..."
                  size="xs"
                  gap="0"
                  px="1"
                >
                  <LuPlus />
                  <LuChevronDown />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="new-note" asChild>
                      <Link to={pages.private.new.path}>
                        <LuFileText />
                        New Note
                      </Link>
                    </Menu.Item>
                    <Menu.Item value="new-recipe" asChild>
                      <Link to={pages.private.recipe.path}>
                        <LuChefHat />
                        New Recipe
                      </Link>
                    </Menu.Item>
                    <Menu.Item value="new-notebook" asChild>
                      <Link to={pages.private.notebooks.path}>
                        <LuBookOpen />
                        New Notebook
                      </Link>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
            <Box hideBelow="md" minWidth="250px">
              <SearchInput />
            </Box>
            <ColorModeButton />
            <Menu.Root positioning={{ placement: "bottom-end" }}>
              <Menu.Trigger>
                <Avatar
                  colorPalette={colorPalette}
                  size="xs"
                  name={authStatus?.username}
                  cursor="pointer"
                />
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="logout" onClick={handleLogout}>
                      <LuLogOut />
                      Logout
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </HStack>
        </HStack>
        <HStack width="inherit" alignItems="start">
          <Flex
            justifyContent="start"
            height="100vh"
            width="250px"
            minWidth="250px"
            maxWidth="250px"
            hideBelow="lg"
            flexDirection="column"
          >
            <Box
              overflowY="auto"
              overflowX="hidden"
              flex={1}
              pb={4}
              pr={2}
              className="custom-scrollbar"
            >
              <NotebookTree />
            </Box>
          </Flex>
          <Box
            as="main"
            width="100%"
            maxWidth="100%"
            minWidth="0"
            overflow="hidden"
          >
            <Outlet />
          </Box>
        </HStack>
      </VStack>
    </Flex>
  )
}
