import { client } from "./client"
import {
  ShoppingList,
  VocabularyItem,
  ToggleItemRequest,
  MergeRecipeRequest,
  fromShoppingListJson,
  fromVocabularyItemJson,
} from "./model/shopping-list"
import { commonHeaders } from "./utils"

export const shoppingListClient = {
  // Get shopping list for a note
  get: (noteId: string) =>
    client
      .get(`notes/${noteId}/shopping-list`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),

  // Enable shopping list mode for a note
  enable: (noteId: string) =>
    client
      .put(`notes/${noteId}/shopping-list`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),

  // Disable shopping list mode for a note
  disable: (noteId: string) =>
    client.delete(`notes/${noteId}/shopping-list`, {
      headers: commonHeaders(),
      credentials: "include",
    }),

  // Toggle item check status
  toggleItem: (itemId: string, checked: boolean) =>
    client.patch(`shopping-list/items/${itemId}/check`, {
      json: {
        checked,
      } as ToggleItemRequest,
      headers: commonHeaders(),
      credentials: "include",
    }),

  // Get vocabulary suggestions for autocomplete
  getVocabulary: (query: string) =>
    client
      .get("shopping-list/vocabulary", {
        searchParams: {
          q: query,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<VocabularyItem[]>()
      .then((items: VocabularyItem[]) => items.map(fromVocabularyItemJson)),

  // Merge recipe ingredients into shopping list
  mergeRecipe: (shoppingListId: string, recipeId: string) =>
    client
      .post(`shopping-list/${shoppingListId}/merge-recipe`, {
        json: {
          recipeId,
        } as MergeRecipeRequest,
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),
}
