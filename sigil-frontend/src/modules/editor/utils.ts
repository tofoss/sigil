/**
 * Checks if the content contains checklist items (markdown checkboxes)
 * @param content - The markdown content to check
 * @returns true if content contains checkbox items, false otherwise
 */
export function hasChecklistItems(content: string): boolean {
  const lines = content.split('\n')
  return lines.some(line => /^\s*-\s*\[([ xX])\]/.test(line))
}
