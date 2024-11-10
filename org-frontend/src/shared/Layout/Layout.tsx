import { Box, Flex, HStack, IconButton, Text, VStack } from "@chakra-ui/react"
import { Avatar } from "components/ui/avatar"
import { Outlet } from "shared/Router"
import { FiMenu } from "react-icons/fi"
import { colorPalette } from "theme"
import { ColorModeButton } from "components/ui/color-mode"

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
import { NavMenu } from "./NavMenu"

export function Layout() {
  return (
    <Flex justifyContent="center" width="full">
      <VStack bg="bg.subtle" height="100%" maxWidth="1080px" width="100%" p="0">
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
                <NavMenu />
              </DrawerBody>
              <DrawerCloseTrigger />
            </DrawerContent>
          </DrawerRoot>
          <Text fontSize="2xl" fontWeight="extrabold">
            org
          </Text>
          <HStack ml="auto">
            <ColorModeButton />
            <Avatar colorPalette={colorPalette} size="xs" name={undefined} />
          </HStack>
        </HStack>
        <HStack width="inherit">
          <Box as="main" width="100%">
            <Outlet />
          </Box>
        </HStack>
      </VStack>
    </Flex>
  )
}
