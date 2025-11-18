import { Box, HStack, Icon, IconButton, Text } from "@chakra-ui/react"
import { noteClient, notebooks, sections as sectionsApi } from "api"
import { Note, Section } from "api/model"
import { LuChevronRight, LuFolder, LuPlus } from "react-icons/lu"
import { useNavigate } from "shared/Router"
import { NoteTreeItem } from "./NoteTreeItem"
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

interface SectionTreeItemProps {
  section: Section
  notes: Note[]
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

  // Drag and drop hooks
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: {
      type: "section",
      sectionId: section.id,
      notebookId,
    },
  })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: "section",
      sectionId: section.id,
      notebookId,
    },
  })

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    setSortableRef(node)
    setDroppableRef(node)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Handle creating a new note in this section
  const handleCreateNote = async () => {
    try {
      const note = await noteClient.upsert("", undefined)
      await notebooks.addNote(notebookId, note.id)
      await sectionsApi.assignNote(note.id, notebookId, section.id)

      // Dispatch event to update the tree - NotebookTree will handle the state update
      window.dispatchEvent(
        new CustomEvent("note-section-changed", {
          detail: {
            noteId: note.id,
            notebookId: notebookId,
            sectionId: section.id,
          },
        })
      )

      navigate(`/notes/${note.id}?edit=true`)
    } catch (err) {
      console.error("Error creating note:", err)
    }
  }

  return (
    <Box>
      {/* Section Header */}
      <HStack
        ref={setRefs}
        {...attributes}
        {...listeners}
        pl={`${paddingLeft}px`}
        pr={2}
        py={1.5}
        gap={2}
        minWidth="0"
        cursor={isDragging ? "grabbing" : "grab"}
        borderRadius="md"
        onClick={onToggle}
        bg={containsActiveNote ? "teal.subtle" : undefined}
        fontWeight={containsActiveNote ? "semibold" : "normal"}
        _hover={{
          bg: containsActiveNote ? "teal.subtle" : "gray.subtle",
        }}
        transition="background 0.15s"
        style={style}
        borderWidth={isOver ? "2px" : "0"}
        borderColor={isOver ? "teal.500" : "transparent"}
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
          title={section.name}
        >
          {section.name}
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
            onClick={(e) => {
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
          <SortableContext
            items={notes.map((note) => note.id)}
            strategy={verticalListSortingStrategy}
          >
            {notes.map((note) => (
              <NoteTreeItem
                key={note.id}
                note={note}
                paddingLeft={paddingLeft + 12}
                notebookId={notebookId}
                sectionId={section.id}
              />
            ))}
          </SortableContext>
        </Box>
      )}
    </Box>
  )
}
