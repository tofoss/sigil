import { HStack, Heading, IconButton, Link as ChakraLink } from "@chakra-ui/react"
import { LuChevronDown, LuChevronRight, LuPlus } from "react-icons/lu"
import { Link } from "shared/Router"
import { pages } from "pages/pages"

interface NotebookTreeHeaderProps {
  totalNotebooks: number
  allExpanded: boolean
  onToggleAll: () => void
  onCreateNotebook: () => void
}

export const NotebookTreeHeader = ({
  totalNotebooks,
  allExpanded,
  onToggleAll,
  onCreateNotebook,
}: NotebookTreeHeaderProps) => {
  return (
    <HStack mb={3} px={2} justifyContent="space-between" data-testid="notebook-header">
      <Heading size="xs" color="fg.muted">
        <ChakraLink asChild>
          <Link to={pages.private.notebooks.path}>
            My Notebooks ({totalNotebooks})
          </Link>
        </ChakraLink>
      </Heading>
      <HStack gap={1}>
        <IconButton
          size="xs"
          variant="ghost"
          aria-label={allExpanded ? "Collapse all" : "Expand all"}
          onClick={onToggleAll}
        >
          {allExpanded ? <LuChevronRight /> : <LuChevronDown />}
        </IconButton>
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Create notebook"
          data-testid="create-notebook-button"
          onClick={onCreateNotebook}
        >
          <LuPlus />
        </IconButton>
      </HStack>
    </HStack>
  )
}
