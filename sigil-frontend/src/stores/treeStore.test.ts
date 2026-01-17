import { beforeEach, describe, expect, it } from "vitest"
import { useTreeStore } from "./treeStore"
import type { TreeNotebook, TreeNote } from "api"

const makeNote = (id: string, title: string): TreeNote => ({ id, title })

const makeNotebook = (overrides: Partial<TreeNotebook> = {}): TreeNotebook => ({
  id: overrides.id ?? "notebook-1",
  title: overrides.title ?? "Notebook 1",
  sections: overrides.sections ?? [],
  unsectioned: overrides.unsectioned ?? [],
})

describe("treeStore", () => {
  beforeEach(() => {
    useTreeStore.setState({
      treeData: [],
      unassignedNotes: [],
      isLoading: false,
      error: null,
    })
  })

  it("updates note titles across tree and unassigned", () => {
    useTreeStore.setState({
      treeData: [
        makeNotebook({
          sections: [
            { id: "section-1", title: "Section 1", notes: [makeNote("note-1", "Old 1")] },
          ],
          unsectioned: [makeNote("note-2", "Old 2")],
        }),
      ],
      unassignedNotes: [makeNote("note-3", "Old 3")],
    })

    const { updateNoteTitle } = useTreeStore.getState()
    updateNoteTitle("note-1", "Updated 1")
    updateNoteTitle("note-2", "Updated 2")
    updateNoteTitle("note-3", "Updated 3")

    const { treeData, unassignedNotes } = useTreeStore.getState()
    expect(treeData[0].sections[0].notes[0].title).toBe("Updated 1")
    expect(treeData[0].unsectioned[0].title).toBe("Updated 2")
    expect(unassignedNotes[0].title).toBe("Updated 3")
  })

  it("deletes notes from tree and unassigned", () => {
    useTreeStore.setState({
      treeData: [
        makeNotebook({
          sections: [
            { id: "section-1", title: "Section 1", notes: [makeNote("note-1", "Note") ] },
          ],
          unsectioned: [makeNote("note-2", "Note 2")],
        }),
      ],
      unassignedNotes: [makeNote("note-3", "Note 3")],
    })

    const { deleteNote } = useTreeStore.getState()
    deleteNote("note-1")
    deleteNote("note-3")

    const { treeData, unassignedNotes } = useTreeStore.getState()
    expect(treeData[0].sections[0].notes).toHaveLength(0)
    expect(treeData[0].unsectioned).toHaveLength(1)
    expect(unassignedNotes).toHaveLength(0)
  })

  it("adds notes to unassigned", () => {
    const { addNoteToTree } = useTreeStore.getState()
    addNoteToTree(makeNote("note-1", "New Note"))

    const { unassignedNotes } = useTreeStore.getState()
    expect(unassignedNotes).toHaveLength(1)
    expect(unassignedNotes[0].title).toBe("New Note")
  })

  it("moves removed notes to unassigned when no longer in notebooks", () => {
    useTreeStore.setState({
      treeData: [
        makeNotebook({
          unsectioned: [makeNote("note-1", "Note")],
        }),
      ],
      unassignedNotes: [],
    })

    const { removeNoteFromNotebook } = useTreeStore.getState()
    removeNoteFromNotebook("note-1", "notebook-1")

    const { treeData, unassignedNotes } = useTreeStore.getState()
    expect(treeData[0].unsectioned).toHaveLength(0)
    expect(unassignedNotes).toHaveLength(1)
    expect(unassignedNotes[0].id).toBe("note-1")
  })

  it("does not add removed notes if still in another notebook", () => {
    useTreeStore.setState({
      treeData: [
        makeNotebook({
          id: "notebook-1",
          unsectioned: [makeNote("note-1", "Note")],
        }),
        makeNotebook({
          id: "notebook-2",
          unsectioned: [makeNote("note-1", "Note")],
        }),
      ],
      unassignedNotes: [],
    })

    const { removeNoteFromNotebook } = useTreeStore.getState()
    removeNoteFromNotebook("note-1", "notebook-1")

    const { treeData, unassignedNotes } = useTreeStore.getState()
    expect(treeData[0].unsectioned).toHaveLength(0)
    expect(treeData[1].unsectioned).toHaveLength(1)
    expect(unassignedNotes).toHaveLength(0)
  })

  it("renames and deletes notebooks", () => {
    useTreeStore.setState({
      treeData: [makeNotebook({ id: "notebook-1", title: "Old" })],
    })

    const { renameNotebook, deleteNotebook } = useTreeStore.getState()
    renameNotebook("notebook-1", "New")

    expect(useTreeStore.getState().treeData[0].title).toBe("New")

    deleteNotebook("notebook-1")
    expect(useTreeStore.getState().treeData).toHaveLength(0)
  })

  it("renames and deletes sections", () => {
    useTreeStore.setState({
      treeData: [
        makeNotebook({
          sections: [
            { id: "section-1", title: "Old Section", notes: [] },
            { id: "section-2", title: "Section 2", notes: [] },
          ],
        }),
      ],
    })

    const { renameSection, deleteSection } = useTreeStore.getState()
    renameSection("section-1", "New Section")

    expect(useTreeStore.getState().treeData[0].sections[0].title).toBe(
      "New Section"
    )

    deleteSection("section-2")
    expect(useTreeStore.getState().treeData[0].sections).toHaveLength(1)
  })
})
