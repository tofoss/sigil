import { type TreeNote, type TreeNotebook } from "api"
import type { Note } from "api/model"
import { useMemo } from "react"
import { useRecentNotesStore } from "stores/recentNotesStore"
import { useShoppingListStore } from "stores/shoppingListStore"
import { useTreeStore } from "stores/treeStore"

export interface NotebookTreeViewNote {
  id: string
  title: string
}

export interface NotebookTreeViewSection {
  id: string
  title: string
  notes: NotebookTreeViewNote[]
}

export interface NotebookTreeViewNotebook {
  id: string
  title: string
  sections: NotebookTreeViewSection[]
  unsectioned: NotebookTreeViewNote[]
}

export interface NotebookTreeViewData {
  notebook: NotebookTreeViewNotebook
  sections: Array<{
    section: NotebookTreeViewSection
    notes: NotebookTreeViewNote[]
  }>
  unsectionedNotes: NotebookTreeViewNote[]
}

const buildViewNotes = (notes: TreeNote[]): NotebookTreeViewNote[] => {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
  }))
}

const buildViewTreeData = (tree: TreeNotebook[]): NotebookTreeViewData[] => {
  return tree.map((notebook) => ({
    notebook: {
      id: notebook.id,
      title: notebook.title,
      sections: notebook.sections.map(
        (section: TreeNotebook["sections"][number]) => ({
          id: section.id,
          title: section.title,
          notes: buildViewNotes(section.notes),
        })
      ),
      unsectioned: buildViewNotes(notebook.unsectioned),
    },
    sections: notebook.sections.map(
      (section: TreeNotebook["sections"][number]) => ({
        section: {
          id: section.id,
          title: section.title,
          notes: buildViewNotes(section.notes),
        },
        notes: buildViewNotes(section.notes),
      })
    ),
    unsectionedNotes: buildViewNotes(notebook.unsectioned),
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

  const viewRecentNotes = useMemo(
    () => buildViewNotes(recentNotes),
    [recentNotes]
  )

  const addViewRecentNote = (note: NotebookTreeViewNote, limit?: number) => {
    addRecentNote({
      id: note.id,
      title: note.title,
      userId: "",
      content: "",
      createdAt: null as unknown as Note["createdAt"],
      updatedAt: null as unknown as Note["updatedAt"],
      publishedAt: undefined,
      published: false,
      tags: [],
    }, limit)
  }

  const treeData = useMemo(() => buildViewTreeData(storeTreeData), [
    storeTreeData,
  ])
  const unassignedNotes = useMemo(
    () => buildViewNotes(storeUnassignedNotes),
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
    recentNotes: viewRecentNotes,
    recentNotesLoading,
    fetchRecentNotes,
    addRecentNote: addViewRecentNote,
    removeRecentNote,
    treeData,
    unassignedNotes,
  }
}
