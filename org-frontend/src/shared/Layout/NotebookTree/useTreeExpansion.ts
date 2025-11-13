import { useState } from "react"

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

  const toggleNotebook = (id: string) => {
    setExpandedNotebooks((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((nid) => nid !== id)
        : [...prev, id]
      localStorage.setItem("expanded-notebooks", JSON.stringify(updated))
      return updated
    })
  }

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
      localStorage.setItem("expanded-sections", JSON.stringify(updated))
      return updated
    })
  }

  const expandNotebook = (id: string) => {
    setExpandedNotebooks((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      localStorage.setItem("expanded-notebooks", JSON.stringify(updated))
      return updated
    })
  }

  const expandSection = (id: string) => {
    setExpandedSections((prev) => {
      if (prev.includes(id)) return prev
      const updated = [...prev, id]
      localStorage.setItem("expanded-sections", JSON.stringify(updated))
      return updated
    })
  }

  return {
    expandedNotebooks,
    expandedSections,
    toggleNotebook,
    toggleSection,
    expandNotebook,
    expandSection,
    isNotebookExpanded: (id: string) => expandedNotebooks.includes(id),
    isSectionExpanded: (id: string) => expandedSections.includes(id),
  }
}
