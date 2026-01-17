import { create } from "zustand"
import { noteClient } from "api"
import type { Note } from "api/model"

interface RecentNotesState {
  recentNotes: Note[]
  isLoading: boolean
  error: string | null
  fetchRecentNotes: (limit?: number) => Promise<void>
  addRecentNote: (note: Note, limit?: number) => void
}

export const useRecentNotesStore = create<RecentNotesState>(
  (set: (partial: Partial<RecentNotesState> | ((state: RecentNotesState) => Partial<RecentNotesState>)) => void) => ({
    recentNotes: [],
    isLoading: false,
    error: null,

    fetchRecentNotes: async (limit = 10) => {
      set({ isLoading: true, error: null })
      try {
        const notes = await noteClient.fetchRecent(limit)
        set({ recentNotes: notes, isLoading: false })
      } catch (err) {
        console.error("Error fetching recent notes:", err)
        set({ error: "Failed to load recent notes", isLoading: false })
      }
    },

    addRecentNote: (note: Note, limit = 10) => {
      set((state: RecentNotesState) => {
        const deduped = state.recentNotes.filter((item: Note) => item.id !== note.id)
        const next = [note, ...deduped].slice(0, limit)
        return { recentNotes: next }
      })
    },
  })
)
