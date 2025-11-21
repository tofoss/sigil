import { HStack, Icon, Text } from "@chakra-ui/react"
import { Note } from "api/model"
import { memo, useState } from "react"
import { LuFileText } from "react-icons/lu"
import { useParams, useNavigate } from "shared/Router"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface NoteTreeItemProps {
  note: Note
  paddingLeft?: number
  notebookId?: string
  sectionId?: string | null
}

export const NoteTreeItem = memo(function NoteTreeItem({
  note,
  paddingLeft = 24,
  notebookId,
  sectionId,
}: NoteTreeItemProps) {
  const { id: currentNoteId } = useParams()
  const navigate = useNavigate()
  const isActive = currentNoteId === note.id
  const [isDraggingState, setIsDraggingState] = useState(false)

  // Drag and drop hooks
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: note.id,
    data: {
      type: "note",
      noteId: note.id,
      notebookId,
      sectionId,
    },
  })

  // Track dragging state to prevent navigation
  if (isDragging !== isDraggingState) {
    setIsDraggingState(isDragging)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation if we just finished dragging
    if (isDraggingState) {
      e.preventDefault()
      return
    }
    navigate(`/notes/${note.id}`)
  }

  return (
    <HStack
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      pl={`${paddingLeft}px`}
      pr={2}
      py={1.5}
      gap={2}
      cursor={isDragging ? "grabbing" : "grab"}
      borderRadius="md"
      bg={isActive ? "bg.muted" : undefined}
      fontWeight={isActive ? "semibold" : "normal"}
      _hover={{
        bg: isActive ? "bg.muted" : "gray.subtle",
      }}
      transition="background 0.15s"
      style={style}
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
    </HStack>
  )
})
