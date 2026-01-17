import React, { type ReactNode } from "react"
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NotebookTree } from "./NotebookTree"
import { renderWithProviders } from "test-utils"
import { useTreeStore } from "stores/treeStore"
import { useRecentNotesStore } from "stores/recentNotesStore"
import { useShoppingListStore } from "stores/shoppingListStore"
import { notebooks } from "api"
import type { TreeNotebook, TreeNote } from "api"
import type { Note } from "api/model"
import type { ShoppingListItem } from "stores/shoppingListStore"
import { useTreeExpansion } from "./useTreeExpansion"

const mockNavigate = vi.fn()
let mockLocation = { pathname: "/" }
let mockParams: { id?: string } = {}

vi.mock("shared/Router", async () => {
  const actual = await vi.importActual<typeof import("shared/Router")>(
    "shared/Router"
  )
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => mockParams,
    Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

vi.mock("stores/treeStore", () => ({
  useTreeStore: vi.fn(),
}))

vi.mock("stores/recentNotesStore", () => ({
  useRecentNotesStore: vi.fn(),
}))

vi.mock("stores/shoppingListStore", () => ({
  useShoppingListStore: vi.fn(),
}))

vi.mock("./useTreeExpansion", () => ({
  useTreeExpansion: vi.fn(),
}))

vi.mock("api", () => ({
  notebooks: {
    create: vi.fn(),
  },
  sections: {
    updatePosition: vi.fn(),
    updateNotePosition: vi.fn(),
    assignNote: vi.fn(),
  },
}))

const makeTreeNotebook = (overrides: Partial<TreeNotebook> = {}): TreeNotebook => ({
  id: overrides.id ?? "notebook-1",
  title: overrides.title ?? "Notebook 1",
  sections: overrides.sections ?? [
    {
      id: "section-1",
      title: "Section 1",
      notes: [{ id: "note-1", title: "Note 1" }],
    },
  ],
  unsectioned: overrides.unsectioned ?? [{ id: "note-2", title: "Note 2" }],
})

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: overrides.id ?? "note-1",
  userId: "user-1",
  title: overrides.title ?? "Note 1",
  content: "",
  createdAt: null as unknown as Note["createdAt"],
  updatedAt: null as unknown as Note["updatedAt"],
  publishedAt: undefined,
  published: false,
  tags: [],
})

const makeShoppingList = (
  overrides: Partial<ShoppingListItem> = {}
): ShoppingListItem => ({
  id: overrides.id ?? "list-1",
  title: overrides.title ?? "List 1",
})

const setupStoreMocks = ({
  treeData = [makeTreeNotebook()],
  unassignedNotes = [{ id: "note-3", title: "Unassigned" }],
  isLoading = false,
  error = null,
  recentNotes = [makeNote({ id: "note-1", title: "Recent Note" })],
  recentLoading = false,
  shoppingLists = [makeShoppingList()],
  shoppingLoading = false,
  expandedNotebooks = ["notebook-1"],
  expandedSections = ["section-1"],
  isUnassignedExpanded = true,
  isShoppingListsExpanded = true,
  isRecentExpanded = true,
}: {
  treeData?: TreeNotebook[]
  unassignedNotes?: TreeNote[]
  isLoading?: boolean
  error?: string | null
  recentNotes?: Note[]
  recentLoading?: boolean
  shoppingLists?: ShoppingListItem[]
  shoppingLoading?: boolean
  expandedNotebooks?: string[]
  expandedSections?: string[]
  isUnassignedExpanded?: boolean
  isShoppingListsExpanded?: boolean
  isRecentExpanded?: boolean
} = {}) => {
  const fetchTree = vi.fn().mockResolvedValue(undefined)
  const fetchRecentNotes = vi.fn().mockResolvedValue(undefined)
  const fetchShoppingLists = vi.fn().mockResolvedValue(undefined)
  const toggleNotebook = vi.fn()
  const toggleSection = vi.fn()
  const expandNotebook = vi.fn()
  const expandSection = vi.fn()
  const collapseAll = vi.fn()
  const expandAll = vi.fn()
  const toggleUnassigned = vi.fn()
  const expandUnassigned = vi.fn()
  const toggleShoppingLists = vi.fn()
  const toggleRecent = vi.fn()

  ;(useTreeStore as unknown as Mock).mockReturnValue({
    treeData,
    unassignedNotes,
    isLoading,
    error,
    fetchTree,
  })

  vi.mocked(useTreeExpansion).mockReturnValue({
    expandedNotebooks,
    expandedSections,
    toggleNotebook,
    toggleSection,
    expandNotebook,
    expandSection,
    isNotebookExpanded: (id: string) => expandedNotebooks.includes(id),
    isSectionExpanded: (id: string) => expandedSections.includes(id),
    collapseAll,
    expandAll,
    isUnassignedExpanded,
    toggleUnassigned,
    expandUnassigned,
    isShoppingListsExpanded,
    toggleShoppingLists,
    isRecentExpanded,
    toggleRecent,
  })

  ;(useRecentNotesStore as unknown as Mock).mockImplementation(
    (selector: (state: { recentNotes: Note[]; isLoading: boolean; fetchRecentNotes: () => Promise<void>; addRecentNote: () => void; removeRecentNote: () => void }) => unknown) =>
      selector({
        recentNotes,
        isLoading: recentLoading,
        fetchRecentNotes,
        addRecentNote: vi.fn(),
        removeRecentNote: vi.fn(),
      })
  )

  ;(useShoppingListStore as unknown as Mock).mockReturnValue({
    shoppingLists,
    isLoading: shoppingLoading,
    fetchShoppingLists,
  })

  return {
    fetchTree,
    fetchRecentNotes,
    fetchShoppingLists,
    toggleNotebook,
    toggleSection,
    expandNotebook,
    expandSection,
    collapseAll,
    expandAll,
    toggleUnassigned,
    expandUnassigned,
    toggleShoppingLists,
    toggleRecent,
  }
}

describe("NotebookTree", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation = { pathname: "/" }
    mockParams = {}
  })

  it("renders loading state", () => {
    setupStoreMocks({ isLoading: true })
    renderWithProviders(<NotebookTree />)

    expect(screen.getByText("My Notebooks")).toBeInTheDocument()
  })

  it("renders empty state when no notebooks", () => {
    setupStoreMocks({ treeData: [] })
    renderWithProviders(<NotebookTree />)

    expect(screen.getByText("No notebooks yet. Create one to get started!")).toBeInTheDocument()
  })

  it("toggles recent notes section", async () => {
    const user = userEvent.setup()
    const { toggleRecent } = setupStoreMocks({ isRecentExpanded: true })

    renderWithProviders(<NotebookTree />)

    expect(screen.getByTestId("recent-notes-list")).toBeInTheDocument()

    await user.click(screen.getByTestId("toggle-recent"))
    expect(toggleRecent).toHaveBeenCalled()
  })

  it("toggles unassigned notes section", async () => {
    const user = userEvent.setup()
    const { toggleUnassigned } = setupStoreMocks({ isUnassignedExpanded: true })
    renderWithProviders(<NotebookTree />)

    expect(screen.getByTestId("unassigned-notes-list")).toBeInTheDocument()

    await user.click(screen.getByTestId("toggle-unassigned"))
    expect(toggleUnassigned).toHaveBeenCalled()
  })

  it("toggles shopping lists section", async () => {
    const user = userEvent.setup()
    const { toggleShoppingLists } = setupStoreMocks({
      isShoppingListsExpanded: true,
    })
    renderWithProviders(<NotebookTree />)

    expect(screen.getByTestId("shopping-lists-list")).toBeInTheDocument()

    await user.click(screen.getByTestId("toggle-shopping-lists"))
    expect(toggleShoppingLists).toHaveBeenCalled()
  })

  it("toggles notebook expansion", async () => {
    const user = userEvent.setup()
    const { toggleNotebook } = setupStoreMocks({
      expandedNotebooks: ["notebook-1"],
      expandedSections: ["section-1"],
      recentNotes: [],
    })
    renderWithProviders(<NotebookTree />)

    expect(screen.getByTestId("note-note-1")).toBeInTheDocument()

    await user.click(screen.getByTestId("notebook-toggle-notebook-1"))
    expect(toggleNotebook).toHaveBeenCalledWith("notebook-1")
  })

  it("auto-expands notebook for active note route", () => {
    const { expandNotebook, expandSection } = setupStoreMocks({
      expandedNotebooks: [],
      expandedSections: [],
    })
    mockLocation = { pathname: "/notes/note-1" }
    mockParams = { id: "note-1" }

    renderWithProviders(<NotebookTree />)

    expect(expandNotebook).toHaveBeenCalledWith("notebook-1")
    expect(expandSection).toHaveBeenCalledWith("section-1")
  })

  it("auto-expands notebook for active notebook route", () => {
    const { expandNotebook } = setupStoreMocks({ expandedNotebooks: [] })
    mockLocation = { pathname: "/notebooks/notebook-1" }
    mockParams = { id: "notebook-1" }

    renderWithProviders(<NotebookTree />)

    expect(expandNotebook).toHaveBeenCalledWith("notebook-1")
  })

  it("opens and cancels create notebook form", async () => {
    const user = userEvent.setup()
    setupStoreMocks()
    renderWithProviders(<NotebookTree />)

    await user.click(screen.getByTestId("create-notebook-button"))
    expect(screen.getByTestId("create-notebook-form")).toBeInTheDocument()

    await user.keyboard("{Escape}")

    expect(screen.queryByTestId("create-notebook-form")).not.toBeInTheDocument()
  })

  it("creates a notebook on enter", async () => {
    const user = userEvent.setup()
    const { fetchTree } = setupStoreMocks()
    ;(notebooks.create as unknown as Mock).mockResolvedValue({})

    renderWithProviders(<NotebookTree />)

    await user.click(screen.getByTestId("create-notebook-button"))
    const input = screen.getByPlaceholderText("Notebook name")

    await user.type(input, "New Notebook{enter}")

    await waitFor(() => {
      expect(notebooks.create).toHaveBeenCalledWith({ name: "New Notebook" })
    })
    expect(fetchTree).toHaveBeenCalled()
  })
})
