import { Box, Heading, HStack, Icon, Stack, Text } from "@chakra-ui/react"
import type { Note } from "api/model"
import { LuChevronRight, LuShoppingCart } from "react-icons/lu"
import { NoteTreeItem } from "./NoteTreeItem"
import { ShoppingListTreeItem } from "./ShoppingListTreeItem"
import type { ShoppingListItem } from "stores/shoppingListStore"

interface RecentNotesSectionProps {
  recentNotes: Note[]
  isExpanded: boolean
  onToggle: () => void
  onRemove: (noteId: string) => void
}

export const RecentNotesSection = ({
  recentNotes,
  isExpanded,
  onToggle,
  onRemove,
}: RecentNotesSectionProps) => {
  if (recentNotes.length === 0) return null

  return (
    <Box mb={4}>
      <HStack
        mb={isExpanded ? 3 : 0}
        pr={2}
        cursor="pointer"
        onClick={onToggle}
        data-testid="toggle-recent"
        _hover={{ bg: "gray.subtle" }}
        borderRadius="md"
        py={1.5}
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          flexShrink={0}
          transform={isExpanded ? "rotate(90deg)" : undefined}
          transition="transform 0.15s"
        >
          <LuChevronRight />
        </Icon>
        <Heading size="xs" color="fg.muted" flex={1}>
          Recent
        </Heading>
        <Text fontSize="xs" color="fg.muted">
          ({recentNotes.length})
        </Text>
      </HStack>

      {isExpanded && (
        <Stack gap={0.5} data-testid="recent-notes-list">
          {recentNotes.map((note) => (
            <NoteTreeItem
              key={note.id}
              note={note}
              paddingLeft={12}
              showRemove
              onRemove={() => onRemove(note.id)}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}

interface UnassignedNotesSectionProps {
  unassignedNotes: Note[]
  isExpanded: boolean
  onToggle: () => void
}

export const UnassignedNotesSection = ({
  unassignedNotes,
  isExpanded,
  onToggle,
}: UnassignedNotesSectionProps) => {
  if (unassignedNotes.length === 0) return null

  return (
    <Box mt={4}>
      <HStack
        mb={isExpanded ? 3 : 0}
        pr={2}
        cursor="pointer"
        onClick={onToggle}
        data-testid="toggle-unassigned"
        _hover={{ bg: "gray.subtle" }}
        borderRadius="md"
        py={1.5}
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          flexShrink={0}
          transform={isExpanded ? "rotate(90deg)" : undefined}
          transition="transform 0.15s"
        >
          <LuChevronRight />
        </Icon>
        <Heading size="xs" color="fg.muted" flex={1}>
          Unassigned Notes ({unassignedNotes.length})
        </Heading>
      </HStack>

      {isExpanded && (
        <Stack gap={0.5} data-testid="unassigned-notes-list">
          {unassignedNotes.map((note) => (
            <NoteTreeItem key={note.id} note={note} paddingLeft={12} />
          ))}
        </Stack>
      )}
    </Box>
  )
}

interface ShoppingListsSectionProps {
  shoppingLists: ShoppingListItem[]
  isExpanded: boolean
  onToggle: () => void
}

export const ShoppingListsSection = ({
  shoppingLists,
  isExpanded,
  onToggle,
}: ShoppingListsSectionProps) => {
  if (shoppingLists.length === 0) return null

  return (
    <Box mt={4}>
      <HStack
        mb={isExpanded ? 3 : 0}
        pr={2}
        cursor="pointer"
        onClick={onToggle}
        data-testid="toggle-shopping-lists"
        _hover={{ bg: "gray.subtle" }}
        borderRadius="md"
        py={1.5}
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          flexShrink={0}
          transform={isExpanded ? "rotate(90deg)" : undefined}
          transition="transform 0.15s"
        >
          <LuChevronRight />
        </Icon>
        <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
          <LuShoppingCart />
        </Icon>
        <Heading size="xs" color="fg.muted" flex={1}>
          Shopping Lists
        </Heading>
        <Text fontSize="xs" color="fg.muted">
          ({shoppingLists.length})
        </Text>
      </HStack>

      {isExpanded && (
        <Stack gap={0.5} data-testid="shopping-lists-list">
          {shoppingLists.map((list) => (
            <ShoppingListTreeItem
              key={list.id}
              shoppingList={list}
              paddingLeft={12}
            />
          ))}
        </Stack>
      )}
    </Box>
  )
}
