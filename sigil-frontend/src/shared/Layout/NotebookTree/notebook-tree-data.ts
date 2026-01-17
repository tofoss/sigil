import { type TreeNote, type TreeNotebook } from "api"
import { Note, Notebook, Section } from "api/model"
import { useMemo } from "react"
import { useRecentNotesStore } from "stores/recentNotesStore"
import { useShoppingListStore } from "stores/shoppingListStore"
import { useTreeStore } from "stores/treeStore"
// eslint-disable-next-line no-restricted-imports
import dayjs from "dayjs"

// Legacy interface for NotebookTreeItem compatibility
export interface TreeData {
  notebook: Notebook
  sections: Array<{
    section: Section
    notes: Note[]
  }>
  unsectionedNotes: Note[]
}

const buildLegacyNotes = (notes: TreeNote[]): Note[] => {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    userId: "",
    content: "",
    createdAt: dayjs(),
    updatedAt: dayjs(),
    publishedAt: undefined,
    published: false,
    tags: [],
  }))
}

const buildLegacyTreeData = (tree: TreeNotebook[]): TreeData[] => {
  return tree.map((notebook) => ({
    notebook: {
      id: notebook.id,
      name: notebook.title,
      user_id: "",
      description: "",
      created_at: dayjs(),
      updated_at: dayjs(),
    } as Notebook,
    sections: notebook.sections.map((section: TreeNotebook["sections"][number]) => ({
      section: {
        id: section.id,
        name: section.title,
        notebook_id: notebook.id,
        position: 0,
        created_at: dayjs(),
        updated_at: dayjs(),
      } as Section,
      notes: buildLegacyNotes(section.notes),
    })),
    unsectionedNotes: buildLegacyNotes(notebook.unsectioned),
  }))
}

export const useNotebookTreeData = () => {
  const {
    treeData: storeTreeData,
    unassignedNotes: storeUnassignedNotes,
    isLoading: loading,
    error,
    fetchTree,
  } = useTreeStore()

  const {
    shoppingLists,
    isLoading: shoppingListsLoading,
    fetchShoppingLists,
  } = useShoppingListStore()

  const recentNotes = useRecentNotesStore(
    (state: { recentNotes: Note[] }) => state.recentNotes
  )
  const recentNotesLoading = useRecentNotesStore(
    (state: { isLoading: boolean }) => state.isLoading
  )
  const fetchRecentNotes = useRecentNotesStore(
    (state: { fetchRecentNotes: (limit?: number) => Promise<void> }) =>
      state.fetchRecentNotes
  )
  const addRecentNote = useRecentNotesStore(
    (state: { addRecentNote: (note: Note, limit?: number) => void }) =>
      state.addRecentNote
  )
  const removeRecentNote = useRecentNotesStore(
    (state: { removeRecentNote: (noteId: string) => Promise<void> }) =>
      state.removeRecentNote
  )

  const treeData = useMemo(() => buildLegacyTreeData(storeTreeData), [
    storeTreeData,
  ])
  const unassignedNotes = useMemo(
    () => buildLegacyNotes(storeUnassignedNotes),
    [storeUnassignedNotes]
  )

  return {
    storeTreeData,
    storeUnassignedNotes,
    loading,
    error,
    fetchTree,
    shoppingLists,
    shoppingListsLoading,
    fetchShoppingLists,
    recentNotes,
    recentNotesLoading,
    fetchRecentNotes,
    addRecentNote,
    removeRecentNote,
    treeData,
    unassignedNotes,
  }
}
