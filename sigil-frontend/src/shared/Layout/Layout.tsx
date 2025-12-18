import {
  Box,
  HStack,
  IconButton,
  Text,
  VStack,
  Menu,
  Portal,
  Avatar,
} from "@chakra-ui/react"
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
import { TOCContext } from "./TOCContext"
import { TableOfContents } from "modules/markdown"
import { useMemo, useState } from "react"

export function Layout() {
  const { data: authStatus } = useFetch(async () => userClient.status())
  const navigate = useNavigate()

  // TOC state management
  const [tocContent, setTocContent] = useState<string | null>(null)

  const hasHeadings = useMemo(() => {
    if (!tocContent) return false
    return /^#{1,4}\s+.+$/m.test(tocContent)
  }, [tocContent])

  const showTOC = hasHeadings

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
    <TOCContext.Provider value={{ content: tocContent, hasHeadings, setContent: setTocContent }}>
      <VStack
        bg="bg.subtle"
        height="100%"
        width="100vw"
        p="0"
        alignItems="start"
        gap={0}
      >
        {/* Top Bar - Full Width */}
        <HStack
          width="100%"
          p="0.25rem"
          pl="0.5rem"
          pr="0.5rem"
        >
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
                <DrawerTitle>Sigil</DrawerTitle>
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
            <Link to={pages.private.home.path}>Sigil</Link>
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
                <Avatar.Root
                  colorPalette={colorPalette}
                  size="xs"
                  cursor="pointer"
                >
                  <Avatar.Fallback name={authStatus?.username} />
                </Avatar.Root>
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

        {/* Three-Column Layout */}
        <HStack width="100%" alignItems="start" gap={0}>
          {/* Left Sidebar - Flush to Edge */}
          <Box
            width="300px"
            minWidth="300px"
            maxWidth="300px"
            height="100vh"
            hideBelow="lg"
          >
            <Box
              overflowY="auto"
              overflowX="hidden"
              height="100%"
              pb={4}
              pr={2}
              className="custom-scrollbar"
            >
              <NotebookTree />
            </Box>
          </Box>

          {/* Main Content - Centered with Max Width */}
          <Box
            flex="1"
            minWidth="0"
            display="flex"
            justifyContent="center"
          >
            <Box
              as="main"
              width="100%"
              maxWidth="800px"
              px={4}
              overflow="hidden"
            >
              <Outlet />
            </Box>
          </Box>

          {/* Right Sidebar - TOC (Conditional) */}
          {showTOC && (
            <Box
              width="270px"
              hideBelow="lg"
            >
              <TableOfContents
                content={tocContent || ""}
                isVisible={showTOC}
              />
            </Box>
          )}
        </HStack>
      </VStack>
    </TOCContext.Provider>
  )
}
