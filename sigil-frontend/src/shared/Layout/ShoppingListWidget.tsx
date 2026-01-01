import { Box, Card, Heading, HStack, Link as ChakraLink, Text, VStack } from "@chakra-ui/react"
import { LuShoppingCart } from "react-icons/lu"
import { shoppingListClient } from "api"
import { useFetch } from "utils/http"
import { Link } from "shared/Router"
import { colorPalette } from "theme"

export function ShoppingListWidget() {
  const { data: shoppingLists, loading } = useFetch(
    () => shoppingListClient.list(),
    []
  )

  // Don't render if loading or no lists
  if (loading || !shoppingLists || shoppingLists.length === 0) {
    return null
  }

  // Get the most recent shopping list (first in array, backend returns DESC order)
  const latestList = shoppingLists[0]

  // Count total items and checked items
  const totalItems = latestList.items.length
  const checkedItems = latestList.items.filter(item => item.checked).length

  return (
    <Box mb={4}>
      <Heading size="sm" mb={2} color="fg.subtle">
        <HStack>
          <LuShoppingCart />
          <Text>Shopping List</Text>
        </HStack>
      </Heading>
      <Card.Root size="sm" colorPalette={colorPalette}>
        <Card.Body>
          <VStack alignItems="start" gap={1}>
            <ChakraLink asChild fontWeight="semibold" fontSize="sm">
              <Link to={`/shopping-lists/${latestList.id}`}>
                {latestList.title}
              </Link>
            </ChakraLink>
            <Text fontSize="xs" color="fg.subtle">
              {checkedItems} of {totalItems} items checked
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Box>
  )
}
