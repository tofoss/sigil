import { HStack, Icon, Text } from "@chakra-ui/react"
import { Note } from "api/model"
import { LuFileText } from "react-icons/lu"
import { Link, useParams } from "shared/Router"

interface NoteTreeItemProps {
  note: Note
  paddingLeft?: number
}

export function NoteTreeItem({ note, paddingLeft = 24 }: NoteTreeItemProps) {
  const { id: currentNoteId } = useParams()
  const isActive = currentNoteId === note.id

  return (
    <Link to={`/notes/${note.id}`} style={{ textDecoration: "none" }}>
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
    </Link>
  )
}
