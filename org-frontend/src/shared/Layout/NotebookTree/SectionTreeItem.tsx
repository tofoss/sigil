import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { Note, Section } from "api/model"
import { LuChevronDown, LuChevronRight, LuFolder } from "react-icons/lu"
import { NoteTreeItem } from "./NoteTreeItem"

interface SectionTreeItemProps {
  section: Section
  notes: Note[]
  isExpanded: boolean
  onToggle: () => void
  paddingLeft?: number
}

export function SectionTreeItem({
  section,
  notes,
  isExpanded,
  onToggle,
  paddingLeft = 12,
}: SectionTreeItemProps) {
  return (
    <Box>
      {/* Section Header */}
      <HStack
        pl={`${paddingLeft}px`}
        pr={2}
        py={1.5}
        gap={2}
        cursor="pointer"
        borderRadius="md"
        onClick={onToggle}
        _hover={{
          bg: "bg.subtle",
        }}
        transition="background 0.2s"
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          flexShrink={0}
          transform={isExpanded ? "rotate(90deg)" : undefined}
          transition="transform 0.2s"
        >
          <LuChevronRight />
        </Icon>
        <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
          <LuFolder />
        </Icon>
        <Text
          fontSize="sm"
          flex={1}
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={section.name}
        >
          {section.name}
        </Text>
        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
          ({notes.length})
        </Text>
      </HStack>

      {/* Notes List */}
      {isExpanded && (
        <Box>
          {notes.length === 0 ? (
            <Text
              fontSize="xs"
              color="fg.muted"
              pl={`${paddingLeft + 24}px`}
              pr={2}
              py={1}
            >
              No notes
            </Text>
          ) : (
            notes.map((note) => (
              <NoteTreeItem
                key={note.id}
                note={note}
                paddingLeft={paddingLeft + 12}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  )
}
