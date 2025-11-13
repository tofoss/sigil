import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { Note, Notebook, Section } from "api/model"
import { LuBookOpen, LuChevronDown, LuChevronRight } from "react-icons/lu"
import { Link, useParams } from "shared/Router"
import { NoteTreeItem } from "./NoteTreeItem"
import { SectionTreeItem } from "./SectionTreeItem"

interface NotebookTreeItemProps {
  notebook: Notebook
  sections: Array<{
    section: Section
    notes: Note[]
  }>
  unsectionedNotes: Note[]
  isExpanded: boolean
  onToggle: () => void
  expandedSections: string[]
  onToggleSection: (sectionId: string) => void
  containsActiveNote?: boolean
  currentNoteId?: string
}

export function NotebookTreeItem({
  notebook,
  sections,
  unsectionedNotes,
  isExpanded,
  onToggle,
  expandedSections,
  onToggleSection,
  containsActiveNote = false,
  currentNoteId,
}: NotebookTreeItemProps) {
  const { id: currentNotebookId } = useParams()
  const isActive = currentNotebookId === notebook.id

  const totalNotes =
    unsectionedNotes.length +
    sections.reduce((sum, { notes }) => sum + notes.length, 0)

  // Find which section contains the active note
  const getActiveSectionId = (): string | null => {
    if (!currentNoteId) return null

    for (const { section, notes } of sections) {
      if (notes.some((note) => note.id === currentNoteId)) {
        return section.id
      }
    }

    return null
  }

  const activeSectionId = getActiveSectionId()

  return (
    <Box>
      {/* Notebook Header */}
      <HStack
        pr={2}
        py={1.5}
        gap={2}
        borderRadius="md"
        bg={
          isActive ? "bg.muted" : containsActiveNote ? "teal.subtle" : undefined
        }
        fontWeight={isActive || containsActiveNote ? "semibold" : "normal"}
        _hover={{
          bg: isActive
            ? "bg.muted"
            : containsActiveNote
            ? "teal.subtle"
            : "gray.subtle",
        }}
        transition="background 0.15s"
      >
        {/* Chevron for expand/collapse */}
        <Icon
          fontSize="sm"
          color="fg.muted"
          flexShrink={0}
          cursor="pointer"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggle()
          }}
          transform={isExpanded ? "rotate(90deg)" : undefined}
        >
          <LuChevronRight />
        </Icon>

        {/* Clickable notebook name */}
        <Box flex={1}>
          <Link
            to={`/notebooks/${notebook.id}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <HStack gap={2}>
              <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
                <LuBookOpen />
              </Icon>
              <Text
                fontSize="sm"
                flex={1}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                title={notebook.name}
              >
                {notebook.name}
              </Text>
            </HStack>
          </Link>
        </Box>

        {/* Note count */}
        <Text fontSize="xs" color="fg.muted" flexShrink={0}>
          ({totalNotes})
        </Text>
      </HStack>

      {/* Expanded Content */}
      {isExpanded && (
        <Box>
          {/* Unsectioned Notes */}
          {unsectionedNotes.length > 0 && (
            <Box mb={1}>
              <Text
                fontSize="xs"
                color="fg.muted"
                pl="12px"
                pr={2}
                py={1}
                fontWeight="medium"
              >
                Unsectioned ({unsectionedNotes.length})
              </Text>
              {unsectionedNotes.map((note) => (
                <NoteTreeItem key={note.id} note={note} paddingLeft={12} />
              ))}
            </Box>
          )}

          {/* Sections */}
          {sections.map(({ section, notes }) => (
            <SectionTreeItem
              key={section.id}
              section={section}
              notes={notes}
              isExpanded={expandedSections.includes(section.id)}
              onToggle={() => onToggleSection(section.id)}
              paddingLeft={12}
              containsActiveNote={activeSectionId === section.id}
            />
          ))}

          {/* Empty State */}
          {sections.length === 0 && unsectionedNotes.length === 0 && (
            <Text fontSize="xs" color="fg.muted" pl="12px" pr={2} py={1}>
              No sections or notes
            </Text>
          )}
        </Box>
      )}
    </Box>
  )
}
