import { create } from "zustand"
import { shoppingListClient } from "api"

export interface ShoppingListItem {
  id: string
  title: string
}

interface ShoppingListState {
  // Data
  shoppingLists: ShoppingListItem[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchShoppingLists: () => Promise<void>
  updateShoppingListTitle: (id: string, title: string) => void
  addShoppingList: (list: ShoppingListItem) => void
  deleteShoppingList: (id: string) => void
}

export const useShoppingListStore = create<ShoppingListState>((set) => ({
  // Initial state
  shoppingLists: [],
  isLoading: false,
  error: null,

  // Fetch shopping lists from API (limit to 5 most recent)
  fetchShoppingLists: async () => {
    set({ isLoading: true, error: null })
    try {
      const lists = await shoppingListClient.list(5)
      set({
        shoppingLists: lists.map(list => ({ id: list.id, title: list.title })),
        isLoading: false,
      })
    } catch (err) {
      console.error("Error fetching shopping lists:", err)
      set({ error: "Failed to load shopping lists", isLoading: false })
    }
  },

  // Update shopping list title
  updateShoppingListTitle: (id: string, title: string) => {
    set((state) => ({
      shoppingLists: state.shoppingLists.map((list) =>
        list.id === id ? { ...list, title } : list
      ),
    }))
  },

  // Add a new shopping list (maintain limit of 5)
  addShoppingList: (list: ShoppingListItem) => {
    set((state) => ({
      shoppingLists: [list, ...state.shoppingLists].slice(0, 5),
    }))
  },

  // Delete shopping list
  deleteShoppingList: (id: string) => {
    set((state) => ({
      shoppingLists: state.shoppingLists.filter((list) => list.id !== id),
    }))
  },
}))
