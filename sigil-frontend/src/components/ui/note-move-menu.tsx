import { Menu, Portal } from "@chakra-ui/react"
import { useMemo } from "react"
import type { ReactNode } from "react"
import { LuChevronRight } from "react-icons/lu"

import { notebooks, sections } from "api"
import { toaster } from "components/ui/toaster"
import { useTreeStore } from "stores/treeStore"

interface NoteMoveMenuProps {
  noteId: string
  sourceNotebookId?: string | null
  sourceSectionId?: string | null
  trigger?: "context" | "button"
  onComplete?: () => void
  children: ReactNode
}

interface NoteLocation {
  notebookId: string | null
  sectionId: string | null
  isUnassigned: boolean
}

interface NotebookItem {
  id: string
  title: string
  sections: Array<{ id: string; title: string }>
}

const findNoteLocation = (
  noteId: string,
  treeData: Array<{
    id: string
    unsectioned: Array<{ id: string }>
    sections: Array<{ id: string; notes: Array<{ id: string }> }>
  }>,
  unassignedNotes: Array<{ id: string }>
): NoteLocation | null => {
  if (unassignedNotes.some((note) => note.id === noteId)) {
    return { notebookId: null, sectionId: null, isUnassigned: true }
  }

  for (const notebook of treeData) {
    if (notebook.unsectioned.some((note) => note.id === noteId)) {
      return { notebookId: notebook.id, sectionId: null, isUnassigned: false }
    }

    for (const section of notebook.sections) {
      if (section.notes.some((note) => note.id === noteId)) {
        return { notebookId: notebook.id, sectionId: section.id, isUnassigned: false }
      }
    }
  }

  return null
}

export function NoteMoveMenu({
  noteId,
  sourceNotebookId,
  sourceSectionId,
  trigger = "context",
  onComplete,
  children,
}: NoteMoveMenuProps) {
  const {
    treeData,
    unassignedNotes,
    fetchTree,
    moveNoteToNotebook,
    moveNoteToSection,
    removeNoteFromNotebook,
  } = useTreeStore()

  const derivedLocation = useMemo(
    () => findNoteLocation(noteId, treeData, unassignedNotes),
    [noteId, treeData, unassignedNotes]
  )

  const resolvedNotebookId = sourceNotebookId ?? derivedLocation?.notebookId ?? null
  const resolvedSectionId = sourceSectionId ?? derivedLocation?.sectionId ?? null
  const isUnassigned =
    sourceNotebookId === null ||
    (sourceNotebookId === undefined && derivedLocation?.isUnassigned) ||
    (!resolvedNotebookId && derivedLocation?.isUnassigned)

  const isCurrentLocation = (
    notebookId: string | null,
    sectionId: string | null
  ) => {
    if (isUnassigned) {
      return notebookId === null
    }

    if (!resolvedNotebookId) {
      return false
    }

    return (
      resolvedNotebookId === notebookId &&
      (resolvedSectionId ?? null) === (sectionId ?? null)
    )
  }

  const handleMove = async (
    targetNotebookId: string | null,
    targetSectionId: string | null
  ) => {
    if (!noteId || isCurrentLocation(targetNotebookId, targetSectionId)) {
      return
    }

    try {
      if (targetNotebookId === null) {
        if (!resolvedNotebookId) {
          return
        }

        await notebooks.removeNote(resolvedNotebookId, noteId)
        removeNoteFromNotebook(noteId, resolvedNotebookId)
      } else if (targetNotebookId === resolvedNotebookId) {
        await sections.assignNote(noteId, targetNotebookId, targetSectionId)
        moveNoteToSection(noteId, targetNotebookId, targetSectionId)
      } else {
        await notebooks.addNote(targetNotebookId, noteId)
        await sections.assignNote(noteId, targetNotebookId, targetSectionId)

        if (resolvedNotebookId) {
          await notebooks.removeNote(resolvedNotebookId, noteId)
        }

        await moveNoteToNotebook(noteId, targetNotebookId, targetSectionId)
      }

      await fetchTree()
      onComplete?.()
      toaster.create({
        title: "Note moved",
        type: "success",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error moving note:", error)
      toaster.create({
        title: "Failed to move note",
        description: "Please try again",
        type: "error",
        duration: 3000,
      })
    }
  }

  const TriggerComponent = trigger === "context" ? Menu.ContextTrigger : Menu.Trigger

  return (
    <Menu.Root>
      <TriggerComponent asChild>{children}</TriggerComponent>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="220px">
            <Menu.Root positioning={{ placement: "right-start", gutter: 2 }}>
              <Menu.TriggerItem>
                Move
                <LuChevronRight />
              </Menu.TriggerItem>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="220px">
                    <Menu.Item
                      value="move-unassigned"
                      disabled={isCurrentLocation(null, null)}
                      onSelect={() => handleMove(null, null)}
                    >
                      Unassigned
                    </Menu.Item>
                    {treeData.length > 0 && <Menu.Separator />}
                    {treeData.map((notebook: NotebookItem) => (
                      <Menu.Root
                        key={notebook.id}
                        positioning={{ placement: "right-start", gutter: 2 }}
                      >
                        <Menu.TriggerItem>
                          {notebook.title}
                          <LuChevronRight />
                        </Menu.TriggerItem>
                        <Portal>
                          <Menu.Positioner>
                            <Menu.Content minW="220px">
                              <Menu.Item
                                value={`move-${notebook.id}-unsectioned`}
                                disabled={isCurrentLocation(notebook.id, null)}
                                onSelect={() => handleMove(notebook.id, null)}
                              >
                                Unsectioned
                              </Menu.Item>
                              {notebook.sections.length > 0 && <Menu.Separator />}
                              {notebook.sections.map((section) => (
                                <Menu.Item
                                  key={section.id}
                                  value={`move-${notebook.id}-${section.id}`}
                                  disabled={isCurrentLocation(notebook.id, section.id)}
                                  onSelect={() => handleMove(notebook.id, section.id)}
                                >
                                  {section.title}
                                </Menu.Item>
                              ))}
                            </Menu.Content>
                          </Menu.Positioner>
                        </Portal>
                      </Menu.Root>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
