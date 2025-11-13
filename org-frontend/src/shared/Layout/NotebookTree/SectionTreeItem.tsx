import { Box, HStack, Icon, IconButton, Text } from "@chakra-ui/react"
import { noteClient, notebooks, sections as sectionsApi } from "api"
import { Note, Section } from "api/model"
import { useState } from "react"
import { LuChevronRight, LuFolder, LuPlus } from "react-icons/lu"
import { useNavigate } from "shared/Router"
import { NoteTreeItem } from "./NoteTreeItem"

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

  // Handle creating a new note in this section
  const handleCreateNote = async () => {
    try {
      const note = await noteClient.upsert("", undefined)
      await notebooks.addNote(notebookId, note.id)
      await sectionsApi.assignNote(note.id, notebookId, section.id)
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
        cursor="pointer"
        borderRadius="md"
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
          <HStack pl={`${paddingLeft + 12}px`} pr={2} py={1}>
            <Text fontSize="xs" color="fg.muted" flex={1}>
              Add note
            </Text>
            <IconButton
              size="2xs"
              variant="ghost"
              aria-label="Create note"
              onClick={handleCreateNote}
            >
              <LuPlus />
            </IconButton>
          </HStack>

          {notes.map((note) => (
            <NoteTreeItem
              key={note.id}
              note={note}
              paddingLeft={paddingLeft + 12}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
