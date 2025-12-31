import { HStack, Icon, Text } from "@chakra-ui/react"
import { ShoppingListItem } from "stores/shoppingListStore"
import { memo } from "react"
import { LuShoppingCart } from "react-icons/lu"
import { Link, useLocation } from "shared/Router"

interface ShoppingListTreeItemProps {
  shoppingList: ShoppingListItem
  paddingLeft?: number
}

export const ShoppingListTreeItem = memo(function ShoppingListTreeItem({
  shoppingList,
  paddingLeft = 24,
}: ShoppingListTreeItemProps) {
  const location = useLocation()
  const isActive = location.pathname === `/shopping-lists/${shoppingList.id}`

  return (
    <Link to={`/shopping-lists/${shoppingList.id}`}>
      <HStack
        pl={`${paddingLeft}px`}
        pr={2}
        py={1.5}
        gap={2}
        cursor="pointer"
        borderRadius="md"
        bg={isActive ? "bg.muted" : undefined}
        fontWeight={isActive ? "semibold" : "normal"}
        _hover={{
          bg: isActive ? "bg.muted" : "gray.subtle",
        }}
        transition="background 0.15s"
      >
        <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
          <LuShoppingCart />
        </Icon>
        <Text
          fontSize="sm"
          flex={1}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={shoppingList.title}
        >
          {shoppingList.title}
        </Text>
      </HStack>
    </Link>
  )
})
