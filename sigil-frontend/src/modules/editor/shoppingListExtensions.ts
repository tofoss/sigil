import { StateField, StateEffect, Extension } from "@codemirror/state"
import { keymap } from "@codemirror/view"
import { autocompletion, CompletionContext } from "@codemirror/autocomplete"
import { shoppingListClient } from "api"
import { VocabularyItem } from "api/model"

// State effect to toggle shopping list mode
export const toggleShoppingListModeEffect = StateEffect.define<boolean>()

// State field to track shopping list mode
export const shoppingListModeField = StateField.define<boolean>({
  create: () => false,
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(toggleShoppingListModeEffect)) {
        return effect.value
      }
    }
    return value
  },
})

// Helper to check if current line is a checkbox line
function isCheckboxLine(line: string): boolean {
  return /^\s*-\s*\[([ xX])\]/.test(line)
}

// Keymap for shopping list mode
export const shoppingListKeymap = keymap.of([
  {
    key: "Enter",
    run: (view) => {
      const mode = view.state.field(shoppingListModeField, false)
      if (!mode) return false

      const { from } = view.state.selection.main
      const line = view.state.doc.lineAt(from)

      // Check if we're on a checkbox line
      if (isCheckboxLine(line.text)) {
        // Get indentation from current line
        const indent = line.text.match(/^(\s*)/)?.[1] || ""

        // Insert newline with checkbox
        view.dispatch({
          changes: { from: line.to, insert: `\n${indent}- [ ] ` },
          selection: { anchor: line.to + indent.length + 7 }, // Position after "- [ ] "
        })
        return true
      }

      return false
    },
  },
])

// Debounce helper
let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debounce(
  func: (query: string, callback: (items: VocabularyItem[]) => void) => void,
  wait: number
): (query: string, callback: (items: VocabularyItem[]) => void) => void {
  return (query: string, callback: (items: VocabularyItem[]) => void) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => func(query, callback), wait)
  }
}

// Autocomplete function for shopping list items
export function shoppingListAutocomplete(): Extension {
  const debouncedFetch = debounce(
    async (
      query: string,
      callback: (items: VocabularyItem[]) => void
    ) => {
      try {
        const items = await shoppingListClient.getVocabulary(query)
        callback(items)
      } catch (error) {
        console.error("Failed to fetch vocabulary:", error)
        callback([])
      }
    },
    300
  )

  return autocompletion({
    activateOnTyping: true,
    override: [
      async (context: CompletionContext) => {
        const mode = context.state.field(shoppingListModeField, false)
        if (!mode) return null

        const { pos } = context
        const line = context.state.doc.lineAt(pos)

        // Only autocomplete on checkbox lines
        if (!isCheckboxLine(line.text)) return null

        // Extract word before cursor
        const textBeforeCursor = line.text.slice(0, pos - line.from)
        const checkboxMatch = textBeforeCursor.match(/^(\s*-\s*\[([ xX])\]\s*)/)
        if (!checkboxMatch) return null

        // Get the text after checkbox but before cursor
        const itemText = textBeforeCursor.slice(checkboxMatch[0].length)

        // Extract the word being typed - match word characters including digits
        const wordMatch = itemText.match(/(\w+)$/)
        if (!wordMatch) return null

        const word = wordMatch[1]

        // Only show suggestions if we have at least 1 character
        if (word.length < 1) return null

        const wordStart = pos - word.length

        // Fetch suggestions
        return new Promise((resolve) => {
          debouncedFetch(word, (items: VocabularyItem[]) => {
            if (items.length === 0) {
              resolve(null)
              return
            }

            resolve({
              from: wordStart,
              options: items.map((item) => ({
                label: item.itemName,
                type: "text",
                boost: item.frequency, // Higher frequency items appear first
              })),
            })
          })
        })
      },
    ],
  })
}

// Main shopping list extension that combines all features
export function shoppingListExtension(): Extension {
  return [shoppingListModeField, shoppingListKeymap, shoppingListAutocomplete()]
}
