import { create } from "zustand"
import {
  treeClient,
  TreeData,
  TreeNotebook,
  TreeSection,
  TreeNote,
  notebooks,
  sections,
  noteClient,
} from "api"
import { Section } from "api/model"

interface TreeState {
  // Data
  treeData: TreeNotebook[]
  unassignedNotes: TreeNote[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchTree: () => Promise<void>

  // Note mutations
  updateNoteTitle: (noteId: string, title: string) => void
  addNoteToTree: (note: TreeNote) => void
  deleteNote: (noteId: string) => void
  moveNoteToNotebook: (
    noteId: string,
    notebookId: string,
    sectionId: string | null
  ) => Promise<void>
  removeNoteFromNotebook: (noteId: string, notebookId: string) => void
  moveNoteToSection: (
    noteId: string,
    notebookId: string,
    sectionId: string | null
  ) => void

  // Notebook mutations
  addNotebook: (notebook: TreeNotebook) => void
  renameNotebook: (notebookId: string, newName: string) => void
  deleteNotebook: (notebookId: string) => void

  // Section mutations
  addSection: (notebookId: string, section: Section) => void
  renameSection: (sectionId: string, newName: string) => void
  deleteSection: (sectionId: string) => void
}

export const useTreeStore = create<TreeState>((set, get) => ({
  // Initial state
  treeData: [],
  unassignedNotes: [],
  isLoading: false,
  error: null,

  // Fetch tree data from API
  fetchTree: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await treeClient.fetch()
      set({
        treeData: data.notebooks,
        unassignedNotes: data.unassigned,
        isLoading: false,
      })
    } catch (err) {
      console.error("Error fetching tree data:", err)
      set({ error: "Failed to load notebooks", isLoading: false })
    }
  },

  // Update note title in tree
  updateNoteTitle: (noteId: string, title: string) => {
    set((state) => {
      // Update in tree data
      const updatedTreeData = state.treeData.map((notebook) => ({
        ...notebook,
        unsectioned: notebook.unsectioned.map((note) =>
          note.id === noteId ? { ...note, title } : note
        ),
        sections: notebook.sections.map((section) => ({
          ...section,
          notes: section.notes.map((note) =>
            note.id === noteId ? { ...note, title } : note
          ),
        })),
      }))

      // Update in unassigned notes
      const updatedUnassigned = state.unassignedNotes.map((note) =>
        note.id === noteId ? { ...note, title } : note
      )

      return {
        treeData: updatedTreeData,
        unassignedNotes: updatedUnassigned,
      }
    })
  },

  // Add a new note to unassigned
  addNoteToTree: (note: TreeNote) => {
    set((state) => ({
      unassignedNotes: [...state.unassignedNotes, note],
    }))
  },

  // Delete note from tree
  deleteNote: (noteId: string) => {
    set((state) => ({
      treeData: state.treeData.map((notebook) => ({
        ...notebook,
        unsectioned: notebook.unsectioned.filter((note) => note.id !== noteId),
        sections: notebook.sections.map((section) => ({
          ...section,
          notes: section.notes.filter((note) => note.id !== noteId),
        })),
      })),
      unassignedNotes: state.unassignedNotes.filter(
        (note) => note.id !== noteId
      ),
    }))
  },

  // Move note to a notebook (and optionally a section)
  moveNoteToNotebook: async (
    noteId: string,
    notebookId: string,
    sectionId: string | null
  ) => {
    const state = get()

    // Find the note in unassigned or in another notebook
    let noteToMove: TreeNote | undefined
    noteToMove = state.unassignedNotes.find((n) => n.id === noteId)

    if (!noteToMove) {
      for (const notebook of state.treeData) {
        noteToMove = notebook.unsectioned.find((n) => n.id === noteId)
        if (noteToMove) break
        for (const section of notebook.sections) {
          noteToMove = section.notes.find((n) => n.id === noteId)
          if (noteToMove) break
        }
        if (noteToMove) break
      }
    }

    if (!noteToMove) {
      // Fetch note data if not found
      try {
        const note = await noteClient.fetch(noteId)
        noteToMove = { id: note.id, title: note.title }
      } catch {
        return
      }
    }

    set((state) => {
      // Remove note from all current locations
      const cleanedTreeData = state.treeData.map((notebook) => ({
        ...notebook,
        unsectioned: notebook.unsectioned.filter((n) => n.id !== noteId),
        sections: notebook.sections.map((section) => ({
          ...section,
          notes: section.notes.filter((n) => n.id !== noteId),
        })),
      }))

      const cleanedUnassigned = state.unassignedNotes.filter(
        (n) => n.id !== noteId
      )

      // Add note to target location
      const updatedTreeData = cleanedTreeData.map((notebook) => {
        if (notebook.id !== notebookId) return notebook

        if (sectionId === null) {
          return {
            ...notebook,
            unsectioned: [...notebook.unsectioned, noteToMove!],
          }
        } else {
          return {
            ...notebook,
            sections: notebook.sections.map((section) =>
              section.id === sectionId
                ? { ...section, notes: [...section.notes, noteToMove!] }
                : section
            ),
          }
        }
      })

      return {
        treeData: updatedTreeData,
        unassignedNotes: cleanedUnassigned,
      }
    })
  },

  // Remove note from notebook (moves to unassigned)
  removeNoteFromNotebook: (noteId: string, notebookId: string) => {
    set((state) => {
      let removedNote: TreeNote | undefined

      const updatedTreeData = state.treeData.map((notebook) => {
        if (notebook.id !== notebookId) return notebook

        // Find the note
        removedNote = notebook.unsectioned.find((n) => n.id === noteId)
        if (!removedNote) {
          for (const section of notebook.sections) {
            removedNote = section.notes.find((n) => n.id === noteId)
            if (removedNote) break
          }
        }

        return {
          ...notebook,
          unsectioned: notebook.unsectioned.filter((n) => n.id !== noteId),
          sections: notebook.sections.map((section) => ({
            ...section,
            notes: section.notes.filter((n) => n.id !== noteId),
          })),
        }
      })

      // Check if note still exists in any notebook
      const stillInAnyNotebook = updatedTreeData.some(
        (notebook) =>
          notebook.unsectioned.some((n) => n.id === noteId) ||
          notebook.sections.some((s) => s.notes.some((n) => n.id === noteId))
      )

      return {
        treeData: updatedTreeData,
        unassignedNotes:
          !stillInAnyNotebook && removedNote
            ? [...state.unassignedNotes, removedNote]
            : state.unassignedNotes,
      }
    })
  },

  // Move note within notebook to different section
  moveNoteToSection: (
    noteId: string,
    notebookId: string,
    sectionId: string | null
  ) => {
    set((state) => ({
      treeData: state.treeData.map((notebook) => {
        if (notebook.id !== notebookId) return notebook

        // Find the note
        let noteToMove: TreeNote | undefined
        noteToMove = notebook.unsectioned.find((n) => n.id === noteId)
        if (!noteToMove) {
          for (const section of notebook.sections) {
            noteToMove = section.notes.find((n) => n.id === noteId)
            if (noteToMove) break
          }
        }

        if (!noteToMove) return notebook

        // Remove from current location
        const cleanedUnsectioned = notebook.unsectioned.filter(
          (n) => n.id !== noteId
        )
        const cleanedSections = notebook.sections.map((section) => ({
          ...section,
          notes: section.notes.filter((n) => n.id !== noteId),
        }))

        // Add to new location
        if (sectionId === null) {
          return {
            ...notebook,
            unsectioned: [...cleanedUnsectioned, noteToMove],
            sections: cleanedSections,
          }
        } else {
          return {
            ...notebook,
            unsectioned: cleanedUnsectioned,
            sections: cleanedSections.map((section) =>
              section.id === sectionId
                ? { ...section, notes: [...section.notes, noteToMove!] }
                : section
            ),
          }
        }
      }),
    }))
  },

  // Add a new notebook
  addNotebook: (notebook: TreeNotebook) => {
    set((state) => ({
      treeData: [...state.treeData, notebook],
    }))
  },

  // Rename notebook
  renameNotebook: (notebookId: string, newName: string) => {
    set((state) => ({
      treeData: state.treeData.map((notebook) =>
        notebook.id === notebookId ? { ...notebook, title: newName } : notebook
      ),
    }))
  },

  // Delete notebook
  deleteNotebook: (notebookId: string) => {
    set((state) => ({
      treeData: state.treeData.filter((notebook) => notebook.id !== notebookId),
    }))
  },

  // Add section to notebook
  addSection: (notebookId: string, section: Section) => {
    set((state) => ({
      treeData: state.treeData.map((notebook) =>
        notebook.id === notebookId
          ? {
              ...notebook,
              sections: [
                ...notebook.sections,
                { id: section.id, title: section.name, notes: [] },
              ],
            }
          : notebook
      ),
    }))
  },

  // Rename section
  renameSection: (sectionId: string, newName: string) => {
    set((state) => ({
      treeData: state.treeData.map((notebook) => ({
        ...notebook,
        sections: notebook.sections.map((section) =>
          section.id === sectionId ? { ...section, title: newName } : section
        ),
      })),
    }))
  },

  // Delete section
  deleteSection: (sectionId: string) => {
    set((state) => ({
      treeData: state.treeData.map((notebook) => ({
        ...notebook,
        sections: notebook.sections.filter(
          (section) => section.id !== sectionId
        ),
      })),
    }))
  },
}))
