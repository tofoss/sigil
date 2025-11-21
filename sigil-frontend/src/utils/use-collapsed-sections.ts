import { useCallback, useState } from "react"

/**
 * Custom hook to manage collapsed state of sections within a notebook
 * Uses localStorage to persist state across page reloads
 *
 * @param notebookId - The ID of the notebook
 * @returns Object with isCollapsed check function and toggle function
 */
export function useCollapsedSections(notebookId: string) {
  const storageKey = `collapsed-sections-${notebookId}`

  // Helper to get current collapsed sections from localStorage
  const getCollapsedSections = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch (error) {
      console.error(
        "Error reading collapsed sections from localStorage:",
        error
      )
      return new Set()
    }
  }, [storageKey])

  // Track state to trigger re-renders when localStorage changes
  const [, setUpdateCounter] = useState(0)

  /**
   * Check if a section is collapsed
   * @param sectionId - The section ID or 'unsectioned' for unsectioned notes
   */
  const isCollapsed = useCallback(
    (sectionId: string): boolean => {
      return getCollapsedSections().has(sectionId)
    },
    [getCollapsedSections]
  )

  /**
   * Toggle the collapsed state of a section
   * @param sectionId - The section ID or 'unsectioned' for unsectioned notes
   */
  const toggle = useCallback(
    (sectionId: string) => {
      try {
        const collapsedSections = getCollapsedSections()

        if (collapsedSections.has(sectionId)) {
          collapsedSections.delete(sectionId)
        } else {
          collapsedSections.add(sectionId)
        }

        localStorage.setItem(
          storageKey,
          JSON.stringify(Array.from(collapsedSections))
        )

        // Trigger re-render
        setUpdateCounter((prev) => prev + 1)
      } catch (error) {
        console.error(
          "Error updating collapsed sections in localStorage:",
          error
        )
      }
    },
    [storageKey, getCollapsedSections]
  )

  return { isCollapsed, toggle }
}
