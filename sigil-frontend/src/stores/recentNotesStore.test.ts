import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { noteClient } from "api"
import { useRecentNotesStore } from "./recentNotesStore"

vi.mock("api", () => ({
  noteClient: {
    deleteRecent: vi.fn(),
  },
}))

const makeNote = (id: string, title: string) => ({
  id,
  title,
})

describe("recentNotesStore", () => {
  beforeEach(() => {
    useRecentNotesStore.setState({
      recentNotes: [],
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  it("adds and de-dupes recent notes", () => {
    const { addRecentNote } = useRecentNotesStore.getState()

    addRecentNote(makeNote("note-1", "First"))
    addRecentNote(makeNote("note-2", "Second"))
    addRecentNote(makeNote("note-1", "First Updated"))

    const { recentNotes } = useRecentNotesStore.getState()
    expect(recentNotes).toHaveLength(2)
    expect(recentNotes[0].id).toBe("note-1")
    expect(recentNotes[0].title).toBe("First Updated")
  })

  it("respects recent note limit", () => {
    const { addRecentNote } = useRecentNotesStore.getState()

    addRecentNote(makeNote("note-1", "One"), 2)
    addRecentNote(makeNote("note-2", "Two"), 2)
    addRecentNote(makeNote("note-3", "Three"), 2)

    const { recentNotes } = useRecentNotesStore.getState()
    expect(recentNotes).toHaveLength(2)
    expect(recentNotes[0].id).toBe("note-3")
  })

  it("removes recent notes", async () => {
    const { removeRecentNote } = useRecentNotesStore.getState()
    ;(noteClient.deleteRecent as unknown as Mock).mockResolvedValue({})

    useRecentNotesStore.setState({
      recentNotes: [makeNote("note-1", "First"), makeNote("note-2", "Second")],
    })

    await removeRecentNote("note-1")

    const { recentNotes } = useRecentNotesStore.getState()
    expect(noteClient.deleteRecent).toHaveBeenCalledWith("note-1")
    expect(recentNotes).toHaveLength(1)
    expect(recentNotes[0].id).toBe("note-2")
  })
})
