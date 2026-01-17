import { Box, HStack, Icon, IconButton, Text } from "@chakra-ui/react"
import { noteClient, notebooks, sections as sectionsApi } from "api"
import type { NotebookTreeViewNote, NotebookTreeViewSection } from "./notebook-tree-data"
import { LuChevronRight, LuFolder, LuPlus } from "react-icons/lu"
import { useNavigate } from "shared/Router"
import { NoteTreeItem } from "./NoteTreeItem"
import { useTreeStore } from "stores/treeStore"

interface SectionTreeItemProps {
  section: NotebookTreeViewSection
  notes: NotebookTreeViewNote[]
  isExpanded: boolean
  onToggle: () => void
  paddingLeft?: number
  containsActiveNote?: boolean
  notebookId: string
}

export function SectionTreeItem({
  section,
  notes,
  isExpanded,
  onToggle,
  paddingLeft = 12,
  containsActiveNote = false,
  notebookId,
}: SectionTreeItemProps) {
  const navigate = useNavigate()
  const { moveNoteToNotebook } = useTreeStore()


  // Handle creating a new note in this section
  const handleCreateNote = async () => {
    try {
      const note = await noteClient.upsert("", undefined)
      await notebooks.addNote(notebookId, note.id)
      await sectionsApi.assignNote(note.id, notebookId, section.id)

      // Update the tree via store
      await moveNoteToNotebook(note.id, notebookId, section.id)

      navigate(`/notes/${note.id}?edit=true`)
    } catch (err) {
      console.error("Error creating note:", err)
    }
  }

  return (
    <Box>
      {/* Section Header */}
      <HStack
        pl={`${paddingLeft}px`}
        pr={2}
        py={1.5}
        gap={2}
        minWidth="0"
        cursor="pointer"
        borderRadius="md"
        data-testid={`section-${section.id}`}
        onClick={onToggle}
        bg={containsActiveNote ? "teal.subtle" : undefined}
        fontWeight={containsActiveNote ? "semibold" : "normal"}
        _hover={{
          bg: containsActiveNote ? "teal.subtle" : "gray.subtle",
        }}
        transition="background 0.15s"
      >
        <Icon
          fontSize="sm"
          color="fg.muted"
          flexShrink={0}
          transform={isExpanded ? "rotate(90deg)" : undefined}
        >
          <LuChevronRight />
        </Icon>
        <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
          <LuFolder />
        </Icon>
        <Text
          fontSize="sm"
          flex={1}
          minWidth="0"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={section.title}
        >
          {section.title}
        </Text>
        {/* Note count with add note button */}
        <HStack gap={0.5} flexShrink={0}>
          <Text fontSize="xs" color="fg.muted">
            ({notes.length})
          </Text>
          <IconButton
            size="2xs"
            variant="ghost"
            aria-label="Create note"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault()
              e.stopPropagation()
              handleCreateNote()
            }}
          >
            <LuPlus />
          </IconButton>
        </HStack>
      </HStack>

      {/* Notes List */}
      {isExpanded && (
        <Box>
          {notes.map((note) => (
            <NoteTreeItem
              key={note.id}
              note={note}
              paddingLeft={paddingLeft + 12}
              notebookId={notebookId}
              sectionId={section.id}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
