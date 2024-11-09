import {
  Box,
  BoxProps,
  Collapse,
  Flex,
  Icon,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { NavItem } from "./NavItem"
import { MdHome, MdKeyboardArrowRight } from "react-icons/md"
import { FaRss, FaClipboardCheck } from "react-icons/fa"
import { HiCollection, HiCode } from "react-icons/hi"
import { AiFillGift } from "react-icons/ai"
import { BsGearFill } from "react-icons/bs"

interface Props extends BoxProps {}

export function SidebarContent(props: Props) {
  const { ...rest } = props
  const integrations = useDisclosure()

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="98"
      h="full"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg="white"
      _dark={{
        bg: "gray.800",
      }}
      color="inherit"
      w="60"
      {...rest}
    >
      <Flex px="4" py="5" align="center">
        {/*<Logo />*/}
        <Text
          fontSize="2xl"
          ml="2"
          color="brand.500"
          _dark={{
            color: "white",
          }}
          fontWeight="semibold"
        >
          Choc UI
        </Text>
      </Flex>
      <Flex
        direction="column"
        as="nav"
        fontSize="sm"
        color="gray.600"
        aria-label="Main Navigation"
      >
        <NavItem icon={MdHome}>Home</NavItem>
        <NavItem icon={FaRss}>Articles</NavItem>
        <NavItem icon={HiCollection}>Collections</NavItem>
        <NavItem icon={FaClipboardCheck}>Checklists</NavItem>
        <NavItem icon={HiCode} onClick={integrations.onToggle}>
          Integrations
          <Icon
            as={MdKeyboardArrowRight}
            ml="auto"
            transform={integrations.isOpen ? "rotate(90deg)" : "auto"}
          />
        </NavItem>
        <Collapse in={integrations.isOpen}>
          <NavItem pl="12" py="2">
            Shopify
          </NavItem>
          <NavItem pl="12" py="2">
            Slack
          </NavItem>
          <NavItem pl="12" py="2">
            Zapier
          </NavItem>
        </Collapse>
        <NavItem icon={AiFillGift}>Changelog</NavItem>
        <NavItem icon={BsGearFill}>Settings</NavItem>
      </Flex>
    </Box>
  )
}
