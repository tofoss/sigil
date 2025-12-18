import { useMemo } from "react"

export interface Heading {
  id: string
  text: string
  level: 1 | 2 | 3 | 4
  children: Heading[]
}

/**
 * Strip markdown formatting from text to generate clean IDs
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/`[^`]+`/g, (match) => match.slice(1, -1)) // Remove inline code backticks but keep content
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/__([^_]+)__/g, "$1") // Remove bold (underscore syntax)
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/_([^_]+)_/g, "$1") // Remove italic (underscore syntax)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .trim()
}

/**
 * Generate heading ID from text (matches MarkdownViewer implementation)
 */
export function id(str: string): string {
  return stripMarkdown(str).replaceAll(" ", "-")
}

/**
 * Extract headings from markdown content and build hierarchical structure
 */
export function useHeadingExtraction(content: string): Heading[] {
  return useMemo(() => {
    if (!content) return []

    const headingRegex = /^(#{1,4})\s+(.+)$/gm
    const flatHeadings: Heading[] = []
    let match: RegExpExecArray | null

    // Extract all headings into flat list
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length as 1 | 2 | 3 | 4
      const text = match[2].trim()

      flatHeadings.push({
        id: id(text),
        text,
        level,
        children: [],
      })
    }

    // Build hierarchical structure
    const root: Heading[] = []
    const stack: Heading[] = []

    for (const heading of flatHeadings) {
      // Pop stack until we find a parent with lower level
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        // Top-level heading
        root.push(heading)
      } else {
        // Add as child of last item in stack
        stack[stack.length - 1].children.push(heading)
      }

      stack.push(heading)
    }

    return root
  }, [content])
}
