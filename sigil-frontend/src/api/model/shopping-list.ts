// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"
import { Quantity } from "./recipe"

export interface ShoppingList {
  id: string
  userId: string
  title: string
  content: string
  contentHash: string
  items: ShoppingListEntry[]
  createdAt: Dayjs
  updatedAt: Dayjs
}

export interface ShoppingListEntry {
  id: string
  shoppingListId: string
  itemName: string
  displayName: string
  quantity?: Quantity
  notes: string
  checked: boolean
  position: number
  sectionHeader: string
  createdAt: Dayjs
}

export interface VocabularyItem {
  id: string
  userId?: string
  itemName: string
  frequency: number
  lastUsed: Dayjs
}

export interface ToggleItemRequest {
  checked: boolean
}

export interface MergeRecipeRequest {
  recipeId: string
}

export function fromShoppingListJson(list: ShoppingList): ShoppingList {
  return {
    ...list,
    createdAt: dayjs(list.createdAt),
    updatedAt: dayjs(list.updatedAt),
    items: list.items.map(fromShoppingListEntryJson),
  }
}

export function fromShoppingListEntryJson(
  entry: ShoppingListEntry
): ShoppingListEntry {
  return {
    ...entry,
    createdAt: dayjs(entry.createdAt),
  }
}

export function fromVocabularyItemJson(item: VocabularyItem): VocabularyItem {
  return {
    ...item,
    lastUsed: dayjs(item.lastUsed),
  }
}
