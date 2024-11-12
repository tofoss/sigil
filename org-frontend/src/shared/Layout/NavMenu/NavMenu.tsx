import {
  HStack,
  Icon,
  LinkBox,
  LinkOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { ReactNode } from "react"
import { LuBook, LuHome, LuPlus } from "react-icons/lu"
import { colors } from "theme/theme"

interface NavMenuProps {
  hideHome?: boolean
}
export function NavMenu({ hideHome }: NavMenuProps) {
  return (
    <VStack>
      {!hideHome && <NavItem icon={<LuHome />} text="Home" href="/" />}
      <NavItem icon={<LuPlus />} text="New post" href="#" />
      <NavItem icon={<LuBook />} text="Browse" href="#" />
    </VStack>
  )
}

interface NavItemProps {
  icon: ReactNode
  text: string
  href: string
  onClick?: () => void
}
function NavItem({ icon, text, href }: NavItemProps) {
  return (
    <LinkBox
      width="100%"
      p="0.5rem"
      display="flex"
      alignItems="center"
      height="2.5rem"
      _hover={{ bg: colors.subtle }}
    >
      <LinkOverlay href={href}>
        <HStack>
          <Icon fontSize="xl" color={colors.solid}>
            {icon}
          </Icon>
          <Text fontSize="xl">{text}</Text>
        </HStack>
      </LinkOverlay>
    </LinkBox>
  )
}
