import { useEffect, useRef } from "react"
import type { Note } from "api/model"
import type { TreeData } from "./notebook-tree-data"

interface NotebookTreeAutoExpandOptions {
  currentId?: string
  currentPath: string
  loading: boolean
  treeData: TreeData[]
  unassignedNotes: Note[]
  storeUnassignedCount: number
  addRecentNote: (note: Note) => void
  expandNotebook: (id: string) => void
  expandSection: (id: string) => void
  expandUnassigned: () => void
}

export const useNotebookTreeAutoExpand = ({
  currentId,
  currentPath,
  loading,
  treeData,
  unassignedNotes,
  storeUnassignedCount,
  addRecentNote,
  expandNotebook,
  expandSection,
  expandUnassigned,
}: NotebookTreeAutoExpandOptions) => {
  const lastAutoExpandedId = useRef<string | null>(null)
  const lastRecentId = useRef<string | null>(null)

  useEffect(() => {
    if (!currentId || !currentPath.startsWith("/notes/")) return
    if (lastRecentId.current === currentId) return

    const match = [
      ...unassignedNotes,
      ...treeData.flatMap(({ unsectionedNotes, sections: sectionsList }) => [
        ...unsectionedNotes,
        ...sectionsList.flatMap(({ notes }) => notes),
      ]),
    ].find((note) => note.id === currentId)

    if (match) {
      lastRecentId.current = currentId
      addRecentNote(match)
    }
  }, [currentId, currentPath, addRecentNote, treeData, unassignedNotes])

  const prevUnassignedCount = useRef(storeUnassignedCount)
  useEffect(() => {
    if (prevUnassignedCount.current === 0 && storeUnassignedCount > 0) {
      expandUnassigned()
    }
    prevUnassignedCount.current = storeUnassignedCount
  }, [storeUnassignedCount, expandUnassigned])

  useEffect(() => {
    if (!currentId || loading || treeData.length === 0) return

    if (lastAutoExpandedId.current === currentId) return

    lastAutoExpandedId.current = currentId

    if (currentPath.startsWith("/notes/")) {
      for (const {
        notebook,
        sections: sectionsList,
        unsectionedNotes,
      } of treeData) {
        if (unsectionedNotes.some((note) => note.id === currentId)) {
          expandNotebook(notebook.id)
          return
        }

        for (const { section, notes: sectionNotes } of sectionsList) {
          if (sectionNotes.some((note) => note.id === currentId)) {
            expandNotebook(notebook.id)
            expandSection(section.id)
            return
          }
        }
      }
    }

    if (currentPath.startsWith("/notebooks/")) {
      const notebookId = currentId
      if (treeData.some((item) => item.notebook.id === notebookId)) {
        expandNotebook(notebookId)
      }
    }
  }, [
    currentId,
    currentPath,
    treeData,
    loading,
    expandNotebook,
    expandSection,
  ])
}
