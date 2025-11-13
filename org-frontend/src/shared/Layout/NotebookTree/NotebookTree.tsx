import { Box, Heading, Stack, Text } from "@chakra-ui/react"
import { notebooks, sections } from "api"
import { Note, Notebook, Section } from "api/model"
import { Skeleton } from "components/ui/skeleton"
import { useEffect, useState } from "react"
import { useLocation, useParams } from "shared/Router"
import { NotebookTreeItem } from "./NotebookTreeItem"
import { useTreeExpansion } from "./useTreeExpansion"

interface TreeData {
  notebook: Notebook
  sections: Array<{
    section: Section
    notes: Note[]
  }>
  unsectionedNotes: Note[]
}

export function NotebookTree() {
  const [treeData, setTreeData] = useState<TreeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    expandedNotebooks,
    expandedSections,
    toggleNotebook,
    toggleSection,
    expandNotebook,
    expandSection,
    isNotebookExpanded,
    isSectionExpanded,
  } = useTreeExpansion()

  const location = useLocation()
  const { id: currentId } = useParams()

  // Fetch all tree data
  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Fetch all notebooks
        const notebooksData = await notebooks.list()

        // 2. For each notebook, fetch sections and unsectioned notes
        const treeDataPromises = notebooksData.map(async (notebook) => {
          const [sectionsData, unsectionedNotesData] = await Promise.all([
            sections.list(notebook.id),
            sections.getUnsectioned(notebook.id),
          ])

          // 3. For each section, fetch notes
          const sectionsWithNotes = await Promise.all(
            sectionsData.map(async (section) => ({
              section,
              notes: await sections.getNotes(section.id),
            }))
          )

          return {
            notebook,
            sections: sectionsWithNotes,
            unsectionedNotes: unsectionedNotesData,
          }
        })

        const data = await Promise.all(treeDataPromises)
        setTreeData(data)
      } catch (err) {
        console.error("Error fetching tree data:", err)
        setError("Failed to load notebooks")
      } finally {
        setLoading(false)
      }
    }

    fetchTreeData()
  }, [])

  // Auto-expand to show active note
  useEffect(() => {
    if (!currentId || loading || treeData.length === 0) return

    // If we're on a note page, find which notebook/section contains it
    if (location.pathname.startsWith("/notes/")) {
      for (const {
        notebook,
        sections: sectionsList,
        unsectionedNotes,
      } of treeData) {
        // Check unsectioned notes
        if (unsectionedNotes.some((note) => note.id === currentId)) {
          expandNotebook(notebook.id)
          return
        }

        // Check sections
        for (const { section, notes: sectionNotes } of sectionsList) {
          if (sectionNotes.some((note) => note.id === currentId)) {
            expandNotebook(notebook.id)
            expandSection(section.id)
            return
          }
        }
      }
    }

    // If we're on a notebook page, expand that notebook
    if (location.pathname.startsWith("/notebooks/")) {
      const notebookId = currentId
      if (treeData.some((item) => item.notebook.id === notebookId)) {
        expandNotebook(notebookId)
      }
    }
  }, [
    currentId,
    location.pathname,
    treeData,
    loading,
    expandNotebook,
    expandSection,
  ])

  // Loading state
  if (loading) {
    return (
      <Box px={2}>
        <Heading size="xs" mb={3} px={2} color="fg.muted">
          My Notebooks
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
          My Notebooks
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
          My Notebooks (0)
        </Heading>
        <Text fontSize="sm" color="fg.muted">
          No notebooks yet. Create one to get started!
        </Text>
      </Box>
    )
  }

  return (
    <Box px={2}>
      <Heading size="xs" mb={3} px={2} color="fg.muted">
        My Notebooks ({treeData.length})
      </Heading>
      <Stack gap={0.5}>
        {treeData.map(
          ({ notebook, sections: sectionsData, unsectionedNotes }) => (
            <NotebookTreeItem
              key={notebook.id}
              notebook={notebook}
              sections={sectionsData}
              unsectionedNotes={unsectionedNotes}
              isExpanded={isNotebookExpanded(notebook.id)}
              onToggle={() => toggleNotebook(notebook.id)}
              expandedSections={expandedSections}
              onToggleSection={toggleSection}
            />
          )
        )}
      </Stack>
    </Box>
  )
}
