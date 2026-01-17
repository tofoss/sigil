import { HStack, Icon, IconButton, Text } from "@chakra-ui/react"
import { Note } from "api/model"
import { memo } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { LuFileText, LuX } from "react-icons/lu"
import { useParams, useNavigate } from "shared/Router"

interface NoteTreeItemProps {
  note: Note
  paddingLeft?: number
  notebookId?: string
  sectionId?: string | null
  showRemove?: boolean
  onRemove?: () => void
}

export const NoteTreeItem = memo(function NoteTreeItem({
  note,
  paddingLeft = 24,
  notebookId,
  sectionId,
  showRemove = false,
  onRemove,
}: NoteTreeItemProps) {
  const { id: currentNoteId } = useParams()
  const navigate = useNavigate()
  const isActive = currentNoteId === note.id

  const handleClick = (_event: ReactMouseEvent) => {
    navigate(`/notes/${note.id}`)
  }

  return (
    <HStack
      pl={`${paddingLeft}px`}
      pr={2}
      py={1.5}
      gap={2}
      cursor="pointer"
      borderRadius="md"
      data-testid={`note-${note.id}`}
      bg={isActive ? "bg.muted" : undefined}
      fontWeight={isActive ? "semibold" : "normal"}
      _hover={{
        bg: isActive ? "bg.muted" : "gray.subtle",
      }}
      transition="background 0.15s"
      onClick={handleClick}
    >
      <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
        <LuFileText />
      </Icon>
      <Text
        fontSize="sm"
        flex={1}
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
        title={note.title || "Untitled"}
      >
        {note.title || "Untitled"}
      </Text>
      {showRemove && onRemove && (
        <IconButton
          size="2xs"
          variant="ghost"
          aria-label="Remove from recent"
          minW="auto"
          h="12px"
          w="12px"
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation()
            onRemove()
          }}
        >
          <LuX />
        </IconButton>
      )}
    </HStack>
  )
})
