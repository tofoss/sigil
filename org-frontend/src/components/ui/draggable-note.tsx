import { Box, HStack, Icon, Text, Link as ChakraLink } from "@chakra-ui/react"
import { useDraggable } from "@dnd-kit/core"
import { Note } from "api/model"
import { LuGripVertical } from "react-icons/lu"
import { Link } from "shared/Router"

interface DraggableNoteProps {
  note: Note
  index: number
  sectionId: string | null // null for unsectioned
}

export function DraggableNote({ note, index, sectionId }: DraggableNoteProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: note.id,
      data: {
        type: "note",
        noteId: note.id,
        currentSectionId: sectionId,
      },
    })

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : undefined,
  }

  return (
    <HStack
      ref={setNodeRef}
      style={style}
      p={2}
      borderRadius="md"
      _hover={{ bg: "bg.muted" }}
      gap={2}
    >
      <Box
        {...attributes}
        {...listeners}
        cursor="grab"
        _active={{ cursor: "grabbing" }}
      >
        <Icon
          fontSize="lg"
          color="fg.muted"
          opacity={0.3}
          _hover={{ opacity: 1 }}
        >
          <LuGripVertical />
        </Icon>
      </Box>
      <Text fontSize="sm" color="fg.muted" minW="6">
        {index + 1}.
      </Text>
      <ChakraLink asChild flex={1}>
        <Link to={`/notes/${note.id}`}>
          <Text flex={1}>{note.title || "Untitled"}</Text>
        </Link>
      </ChakraLink>
    </HStack>
  )
}
