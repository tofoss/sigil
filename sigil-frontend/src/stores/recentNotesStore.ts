import { create } from "zustand"
import { noteClient } from "api"
import type { Note } from "api/model"

interface RecentNote {
  id: string
  title: string
}

interface RecentNotesState {
  recentNotes: RecentNote[]
  isLoading: boolean
  error: string | null
  fetchRecentNotes: (limit?: number) => Promise<void>
  addRecentNote: (note: RecentNote, limit?: number) => void
  removeRecentNote: (noteId: string) => Promise<void>
}

export const useRecentNotesStore = create<RecentNotesState>(
  (set: (partial: Partial<RecentNotesState> | ((state: RecentNotesState) => Partial<RecentNotesState>)) => void) => ({
    recentNotes: [],
    isLoading: false,
    error: null,

    fetchRecentNotes: async (limit = 5) => {
      set({ isLoading: true, error: null })
      try {
        const notes = await noteClient.fetchRecent(limit)
        set({
          recentNotes: notes.map((note: Note) => ({
            id: note.id,
            title: note.title,
          })),
          isLoading: false,
        })
      } catch (err) {
        console.error("Error fetching recent notes:", err)
        set({ error: "Failed to load recent notes", isLoading: false })
      }
    },

    addRecentNote: (note: RecentNote, limit = 5) => {
      set((state: RecentNotesState) => {
        const deduped = state.recentNotes.filter(
          (item: RecentNote) => item.id !== note.id
        )
        const next = [note, ...deduped].slice(0, limit)
        return { recentNotes: next }
      })
    },

    removeRecentNote: async (noteId: string) => {
      try {
        await noteClient.deleteRecent(noteId)
        set((state: RecentNotesState) => ({
          recentNotes: state.recentNotes.filter(
            (note: RecentNote) => note.id !== noteId
          ),
        }))
      } catch (err) {
        console.error("Error deleting recent note:", err)
        set({ error: "Failed to remove recent note" })
      }
    },
  })
)
