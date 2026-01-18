import { HStack, Icon, Text, Link as ChakraLink } from "@chakra-ui/react"
import { Note } from "api/model"
import { LuFileText } from "react-icons/lu"
import { Link } from "shared/Router"

interface DraggableNoteProps {
  note: Note
  index: number
}

export function DraggableNote({ note, index }: DraggableNoteProps) {
  return (
    <HStack p={2} borderRadius="md" _hover={{ bg: "bg.muted" }} gap={2}>
      <Icon fontSize="sm" color="fg.muted">
        <LuFileText />
      </Icon>
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
