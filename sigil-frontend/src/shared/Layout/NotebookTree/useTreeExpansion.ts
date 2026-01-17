import { useCallback, useState } from "react"

export function useTreeExpansion() {
  const [expandedNotebooks, setExpandedNotebooks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("expanded-notebooks")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("expanded-sections")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [isUnassignedExpanded, setIsUnassignedExpanded] = useState<boolean>(
    () => {
      try {
        const stored = localStorage.getItem("expanded-unassigned")
        return stored ? JSON.parse(stored) : false
      } catch {
        return false
      }
    }
  )

  const [isShoppingListsExpanded, setIsShoppingListsExpanded] = useState<boolean>(
    () => {
      try {
        const stored = localStorage.getItem("expanded-shopping-lists")
        return stored ? JSON.parse(stored) : false
      } catch {
        return false
      }
    }
  )

  const [isRecentExpanded, setIsRecentExpanded] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("expanded-recent")
      return stored ? JSON.parse(stored) : false
    } catch {
      return false
    }
  })

  const toggleNotebook = useCallback((id: string) => {
    setExpandedNotebooks((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((nid) => nid !== id)
        : [...prev, id]
      localStorage.setItem("expanded-notebooks", JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
      localStorage.setItem("expanded-sections", JSON.stringify(updated))
      return updated
    })
  }, [])

  const expandNotebook = useCallback((id: string) => {
    setExpandedNotebooks((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      localStorage.setItem("expanded-notebooks", JSON.stringify(updated))
      return updated
    })
  }, [])

  const expandSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      localStorage.setItem("expanded-sections", JSON.stringify(updated))
      return updated
    })
  }, [])

  const isNotebookExpanded = useCallback(
    (id: string) => expandedNotebooks.includes(id),
    [expandedNotebooks]
  )

  const isSectionExpanded = useCallback(
    (id: string) => expandedSections.includes(id),
    [expandedSections]
  )

  const collapseAll = useCallback(() => {
    setExpandedNotebooks([])
    setExpandedSections([])
    localStorage.setItem("expanded-notebooks", JSON.stringify([]))
    localStorage.setItem("expanded-sections", JSON.stringify([]))
  }, [])

  const expandAll = useCallback(
    (notebookIds: string[], sectionIds: string[]) => {
      setExpandedNotebooks(notebookIds)
      setExpandedSections(sectionIds)
      localStorage.setItem("expanded-notebooks", JSON.stringify(notebookIds))
      localStorage.setItem("expanded-sections", JSON.stringify(sectionIds))
    },
    []
  )

  const toggleUnassigned = useCallback(() => {
    setIsUnassignedExpanded((prev) => {
      const updated = !prev
      localStorage.setItem("expanded-unassigned", JSON.stringify(updated))
      return updated
    })
  }, [])

  const expandUnassigned = useCallback(() => {
    setIsUnassignedExpanded((prev) => {
      if (prev) return prev
      localStorage.setItem("expanded-unassigned", JSON.stringify(true))
      return true
    })
  }, [])

  const toggleShoppingLists = useCallback(() => {
    setIsShoppingListsExpanded((prev) => {
      const updated = !prev
      localStorage.setItem("expanded-shopping-lists", JSON.stringify(updated))
      return updated
    })
  }, [])

  const toggleRecent = useCallback(() => {
    setIsRecentExpanded((prev) => {
      const updated = !prev
      localStorage.setItem("expanded-recent", JSON.stringify(updated))
      return updated
    })
  }, [])

  return {
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
  }
}
