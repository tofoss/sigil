import { Box, HStack, Icon, IconButton, Input, Text } from "@chakra-ui/react"
import { noteClient, notebooks, sections as sectionsApi } from "api"
import { Note, Notebook, Section } from "api/model"
import { useState } from "react"
import { LuBookOpen, LuChevronRight, LuPlus, LuX } from "react-icons/lu"
import { Link, useNavigate, useParams } from "shared/Router"
import { NoteTreeItem } from "./NoteTreeItem"
import { SectionTreeItem } from "./SectionTreeItem"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

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
  onRefresh: () => Promise<void>
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
  onRefresh,
}: NotebookTreeItemProps) {
  const { id: currentNotebookId } = useParams()
  const navigate = useNavigate()
  const isActive = currentNotebookId === notebook.id

  const [isCreatingSection, setIsCreatingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  const [isCreatingUnsectionedNote, setIsCreatingUnsectionedNote] =
    useState(false)

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

  // Handle creating a new section
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return

    try {
      await sectionsApi.create({
        notebook_id: notebook.id,
        name: newSectionName.trim(),
        position: sections.length,
      })
      setNewSectionName("")
      setIsCreatingSection(false)
      await onRefresh()
    } catch (err) {
      console.error("Error creating section:", err)
    }
  }

  // Handle creating a new unsectioned note
  const handleCreateUnsectionedNote = async () => {
    try {
      const note = await noteClient.upsert("", undefined)
      await notebooks.addNote(notebook.id, note.id)

      // Dispatch event to update the tree - NotebookTree will handle the state update
      window.dispatchEvent(
        new CustomEvent("note-added-to-notebook", {
          detail: {
            noteId: note.id,
            notebookId: notebook.id,
          },
        })
      )

      setIsCreatingUnsectionedNote(false)
      navigate(`/notes/${note.id}?edit=true`)
    } catch (err) {
      console.error("Error creating note:", err)
    }
  }

  return (
    <Box>
      {/* Notebook Header */}
      <HStack
        pr={2}
        py={1.5}
        gap={2}
        minWidth="0"
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
        <Box flex={1} minWidth="0">
          <Link
            to={`/notebooks/${notebook.id}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <HStack gap={2} minWidth="0">
              <Icon fontSize="sm" color="fg.muted" flexShrink={0}>
                <LuBookOpen />
              </Icon>
              <Text
                fontSize="sm"
                flex={1}
                minWidth="0"
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

        {/* Note count with add section button */}
        <HStack gap={0.5} flexShrink={0}>
          <Text fontSize="xs" color="fg.muted">
            ({totalNotes})
          </Text>
          <IconButton
            size="2xs"
            variant="ghost"
            aria-label="Create section"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsCreatingSection(true)
            }}
          >
            <LuPlus />
          </IconButton>
        </HStack>
      </HStack>

      {/* Expanded Content */}
      {isExpanded && (
        <Box>
          {/* Create Section Input */}
          {isCreatingSection && (
            <HStack pl="12px" pr={2} py={1} mb={1}>
              <Input
                size="xs"
                placeholder="Section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateSection()
                  } else if (e.key === "Escape") {
                    setIsCreatingSection(false)
                    setNewSectionName("")
                  }
                }}
                autoFocus
                flex={1}
              />
              <IconButton
                size="2xs"
                variant="ghost"
                aria-label="Cancel"
                onClick={() => {
                  setIsCreatingSection(false)
                  setNewSectionName("")
                }}
              >
                <LuX />
              </IconButton>
            </HStack>
          )}

          {/* Unsectioned Notes */}
          {(unsectionedNotes.length > 0 || isCreatingUnsectionedNote) && (
            <Box mb={1}>
              <HStack pl="12px" pr={2} py={1}>
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  fontWeight="medium"
                  flex={1}
                >
                  Unsectioned ({unsectionedNotes.length})
                </Text>
                <IconButton
                  size="2xs"
                  variant="ghost"
                  aria-label="Create note"
                  onClick={handleCreateUnsectionedNote}
                >
                  <LuPlus />
                </IconButton>
              </HStack>
              <SortableContext
                items={unsectionedNotes.map((note) => note.id)}
                strategy={verticalListSortingStrategy}
              >
                {unsectionedNotes.map((note) => (
                  <NoteTreeItem
                    key={note.id}
                    note={note}
                    paddingLeft={12}
                    notebookId={notebook.id}
                    sectionId={null}
                  />
                ))}
              </SortableContext>
            </Box>
          )}

          {/* Sections */}
          <SortableContext
            items={sections.map(({ section }) => section.id)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map(({ section, notes }) => (
              <SectionTreeItem
                key={section.id}
                section={section}
                notes={notes}
                isExpanded={expandedSections.includes(section.id)}
                onToggle={() => onToggleSection(section.id)}
                paddingLeft={12}
                containsActiveNote={activeSectionId === section.id}
                notebookId={notebook.id}
              />
            ))}
          </SortableContext>

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
