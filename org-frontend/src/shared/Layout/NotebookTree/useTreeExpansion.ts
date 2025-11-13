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
  }
}
