import {
  HStack,
  Icon,
  LinkBox,
  LinkOverlay,
  Text,
  VStack,
} from "@chakra-ui/react"
import { pages } from "pages/pages"
import { ReactNode } from "react"
import { useNavigate } from "shared/Router"
import { colors } from "theme/theme"

interface NavMenuProps {
  hideHome?: boolean
}
export function NavMenu({ hideHome }: NavMenuProps) {
  const navigate = useNavigate()

  return (
    <VStack>
      {Object.values(pages.private).map((page) => {
        const item = (
          <NavItem icon={<page.icon />} text={page.display} href={page.path} />
        )
        if (page.path === pages.private.home.path && !hideHome) {
          return item
        } else if (page.path !== pages.private.home.path) {
          return item
        }
      })}
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
