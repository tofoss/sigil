import { Box, HStack, Heading, IconButton, Input, Stack, Text, Link as ChakraLink } from "@chakra-ui/react"
import { notebooks } from "api"
import { Skeleton } from "components/ui/skeleton"
import { useEffect, useState } from "react"
import { LuX } from "react-icons/lu"
import type { ChangeEvent, KeyboardEvent } from "react"
import { Link, useLocation, useParams } from "shared/Router"
import { NotebookTreeItem } from "./NotebookTreeItem"
import { useTreeExpansion } from "./useTreeExpansion"
import { useNotebookTreeData } from "./notebook-tree-data"
import { NotebookTreeHeader } from "./NotebookTreeHeader"
import {
  RecentNotesSection,
  ShoppingListsSection,
  UnassignedNotesSection,
} from "./NotebookTreeSections"
import { useNotebookTreeAutoExpand } from "./useNotebookTreeAutoExpand"

export function NotebookTree() {
  const {
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
  } = useNotebookTreeData()

  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState("")

  const {
    expandedNotebooks,
    expandedSections,
    toggleNotebook,
    toggleSection,
    expandNotebook,
    expandSection,
    isNotebookExpanded,
    isSectionExpanded,
    collapseAll,
    expandAll,
    isUnassignedExpanded,
    toggleUnassigned,
    expandUnassigned,
    isShoppingListsExpanded,
    toggleShoppingLists,
    isRecentExpanded,
    toggleRecent,
  } = useTreeExpansion()

  const location = useLocation()
  const { id: currentId } = useParams()

  const currentPath = location.pathname

  // Track the last auto-expanded ID to prevent continuous re-expansion


  // Handle creating a new notebook
  const handleCreateNotebook = async () => {
    if (!newNotebookName.trim()) return

    try {
      await notebooks.create({ name: newNotebookName.trim() })
      setNewNotebookName("")
      setIsCreatingNotebook(false)
      await fetchTree() // Refresh tree
    } catch (err) {
      console.error("Error creating notebook:", err)
    }
  }

  useEffect(() => {
    fetchTree()
    fetchShoppingLists()
    fetchRecentNotes()
  }, [fetchTree, fetchShoppingLists, fetchRecentNotes])

  useNotebookTreeAutoExpand({
    currentId,
    currentPath,
    loading,
    treeData,
    unassignedNotes,
    storeUnassignedCount: storeUnassignedNotes.length,
    addRecentNote,
    expandNotebook,
    expandSection,
    expandUnassigned,
  })

  // Loading state
  if (loading) {
    return (
      <Box px={2}>
        <Heading size="xs" mb={3} px={2} color="fg.muted">
          <ChakraLink asChild>
            <Link to="/notebooks">My Notebooks</Link>
          </ChakraLink>
        </Heading>
        <Stack gap={2}>
          <Skeleton height="32px" />
          <Skeleton height="32px" />
          <Skeleton height="32px" />
        </Stack>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box px={4} py={2}>
        <Heading size="xs" mb={2} color="fg.muted">
          <ChakraLink asChild>
            <Link to="/notebooks">My Notebooks</Link>
          </ChakraLink>
        </Heading>
        <Text fontSize="sm" color="fg.error">
          {error}
        </Text>
      </Box>
    )
  }

  // Empty state
  if (treeData.length === 0) {
    return (
      <Box px={4} py={2}>
        <Heading size="xs" mb={2} color="fg.muted">
          <ChakraLink asChild>
            <Link to="/notebooks">My Notebooks</Link>
          </ChakraLink>
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          No notebooks yet. Create one to get started!
        </Text>
      </Box>
    )
  }

  // Calculate which notebook contains the active note
  const getActiveNotebookId = (): string | null => {
    if (!currentId) return null

    if (location.pathname.startsWith("/notes/")) {
      for (const {
        notebook,
        sections: sectionsList,
        unsectionedNotes,
      } of treeData) {
        // Check unsectioned notes
        if (unsectionedNotes.some((note) => note.id === currentId)) {
          return notebook.id
        }

        // Check sections
        for (const { notes: sectionNotes } of sectionsList) {
          if (sectionNotes.some((note) => note.id === currentId)) {
            return notebook.id
          }
        }
      }
    }

    if (location.pathname.startsWith("/notebooks/")) {
      return currentId
    }

    return null
  }

  const activeNotebookId = getActiveNotebookId()

  // Determine if all notebooks are expanded
  const allExpanded =
    treeData.length > 0 &&
    treeData.every((item) => expandedNotebooks.includes(item.notebook.id))

  // Handle collapse/expand all
  const handleToggleAll = () => {
    if (allExpanded) {
      collapseAll()
    } else {
      const notebookIds = treeData.map((item) => item.notebook.id)
      const sectionIds = treeData.flatMap((item) =>
        item.sections.map(({ section }) => section.id)
      )
      expandAll(notebookIds, sectionIds)
    }
  }

  return (
    <Box px={2}>
      {!recentNotesLoading && (
        <RecentNotesSection
          recentNotes={recentNotes}
          isExpanded={isRecentExpanded}
          onToggle={toggleRecent}
          onRemove={removeRecentNote}
        />
      )}

      <NotebookTreeHeader
        totalNotebooks={treeData.length}
        allExpanded={allExpanded}
        onToggleAll={handleToggleAll}
        onCreateNotebook={() => setIsCreatingNotebook(true)}
      />

      <Stack gap={0.5}>
        {isCreatingNotebook && (
          <HStack px={2} py={1.5} gap={2} data-testid="create-notebook-form">
            <Input
              size="sm"
              placeholder="Notebook name"
              value={newNotebookName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setNewNotebookName(e.target.value)
              }
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleCreateNotebook()
                } else if (e.key === "Escape") {
                  setIsCreatingNotebook(false)
                  setNewNotebookName("")
                }
              }}
              autoFocus
            />
            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Cancel"
              onClick={() => {
                setIsCreatingNotebook(false)
                setNewNotebookName("")
              }}
            >
              <LuX />
            </IconButton>
          </HStack>
        )}

        {treeData.map(({ notebook, sections: sectionsData, unsectionedNotes }) => (
          <NotebookTreeItem
            key={notebook.id}
            notebook={notebook}
            sections={sectionsData}
            unsectionedNotes={unsectionedNotes}
            isExpanded={isNotebookExpanded(notebook.id)}
            onToggle={() => toggleNotebook(notebook.id)}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            containsActiveNote={activeNotebookId === notebook.id}
            currentNoteId={currentPath.startsWith("/notes/") ? currentId : undefined}
            onRefresh={fetchTree}
          />
        ))}
      </Stack>

      <UnassignedNotesSection
        unassignedNotes={unassignedNotes}
        isExpanded={isUnassignedExpanded}
        onToggle={toggleUnassigned}
      />

      {shoppingLists && !shoppingListsLoading && (
        <ShoppingListsSection
          shoppingLists={shoppingLists}
          isExpanded={isShoppingListsExpanded}
          onToggle={toggleShoppingLists}
        />
      )}
    </Box>
  )
}
