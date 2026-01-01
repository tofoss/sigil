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
  // List all shopping lists for current user
  list: (limit?: number) =>
    client
      .get("shopping-lists", {
        searchParams: limit ? { limit: limit.toString() } : {},
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList[]>()
      .then((lists: ShoppingList[]) => lists.map(fromShoppingListJson)),

  // Get single shopping list by ID
  get: (id: string) =>
    client
      .get(`shopping-lists/${id}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),

  // Create new shopping list
  create: (content: string, title?: string) =>
    client
      .post("shopping-lists", {
        json: {
          content,
          title,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),

  // Update shopping list
  update: (id: string, content: string, title?: string) =>
    client
      .put(`shopping-lists/${id}`, {
        json: {
          content,
          title,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),

  // Delete shopping list
  delete: (id: string) =>
    client.delete(`shopping-lists/${id}`, {
      headers: commonHeaders(),
      credentials: "include",
    }),

  // Toggle item check status
  toggleItem: (itemId: string, checked: boolean) =>
    client.patch(`shopping-lists/items/${itemId}/check`, {
      json: {
        checked,
      } as ToggleItemRequest,
      headers: commonHeaders(),
      credentials: "include",
    }),

  // Get vocabulary suggestions for autocomplete
  getVocabulary: (query: string) =>
    client
      .get("shopping-lists/vocabulary", {
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
      .post(`shopping-lists/${shoppingListId}/merge-recipe`, {
        json: {
          recipeId,
        } as MergeRecipeRequest,
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<ShoppingList>()
      .then(fromShoppingListJson),
}
