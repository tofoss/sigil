import { beforeEach, describe, expect, it } from "vitest"
import { useShoppingListStore } from "./shoppingListStore"

const makeList = (id: string, title: string) => ({ id, title })

describe("shoppingListStore", () => {
  beforeEach(() => {
    useShoppingListStore.setState({
      shoppingLists: [],
      isLoading: false,
      error: null,
    })
  })

  it("updates shopping list titles", () => {
    useShoppingListStore.setState({
      shoppingLists: [makeList("list-1", "Old")],
    })

    const { updateShoppingListTitle } = useShoppingListStore.getState()
    updateShoppingListTitle("list-1", "New")

    expect(useShoppingListStore.getState().shoppingLists[0].title).toBe("New")
  })

  it("adds shopping lists with max limit", () => {
    const { addShoppingList } = useShoppingListStore.getState()

    addShoppingList(makeList("list-1", "One"))
    addShoppingList(makeList("list-2", "Two"))
    addShoppingList(makeList("list-3", "Three"))
    addShoppingList(makeList("list-4", "Four"))
    addShoppingList(makeList("list-5", "Five"))
    addShoppingList(makeList("list-6", "Six"))

    const { shoppingLists } = useShoppingListStore.getState()
    expect(shoppingLists).toHaveLength(5)
    expect(shoppingLists[0].id).toBe("list-6")
    expect(shoppingLists[4].id).toBe("list-2")
  })

  it("deletes shopping lists", () => {
    useShoppingListStore.setState({
      shoppingLists: [makeList("list-1", "Old"), makeList("list-2", "Keep")],
    })

    const { deleteShoppingList } = useShoppingListStore.getState()
    deleteShoppingList("list-1")

    const { shoppingLists } = useShoppingListStore.getState()
    expect(shoppingLists).toHaveLength(1)
    expect(shoppingLists[0].id).toBe("list-2")
  })
})
