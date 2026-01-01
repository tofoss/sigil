import { Box } from "@chakra-ui/react"
import { Editor } from "modules/editor"
import { useNavigate } from "shared/Router"
import { shoppingListClient } from "api"
import { useState } from "react"
import { useShoppingListStore } from "stores/shoppingListStore"
// eslint-disable-next-line no-restricted-imports
import dayjs from "dayjs"

export function Component() {
  const navigate = useNavigate()
  const [isSaving, setIsSaving] = useState(false)
  const { addShoppingList } = useShoppingListStore()

  // Pre-fill with template: current date and empty checkbox
  const today = new Date().toISOString().split("T")[0]
  const template = `# ${today}\n\n- [ ] `

  const handleSave = async (content: string) => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const shoppingList = await shoppingListClient.create(content)
      // Add to sidebar tree via store
      addShoppingList({ id: shoppingList.id, title: shoppingList.title })
      // Navigate to the shopping list view page
      navigate(`/shopping-lists/${shoppingList.id}`)
    } catch (error) {
      console.error("Failed to create shopping list:", error)
      setIsSaving(false)
    }
  }

  // Create a temporary shopping list object for the editor
  const tempShoppingList = {
    id: "",
    userId: "",
    title: today,
    content: template,
    contentHash: "",
    items: [],
    createdAt: dayjs(),
    updatedAt: dayjs(),
  }

  return (
    <Box width="100%">
      <Editor
        shoppingList={tempShoppingList}
        mode="Edit"
        onSave={handleSave}
        onModeChange={() => {}}
      />
    </Box>
  )
}

export const ErrorBoundary = () => <p>500</p>
