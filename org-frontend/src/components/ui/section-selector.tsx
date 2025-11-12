import { HStack, Text, createListCollection } from "@chakra-ui/react"
import { sections } from "api"
import { Notebook } from "api/model"
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "components/ui/select"
import { useFetch } from "utils/http"
import { useState } from "react"

interface SectionSelectorProps {
  notebook: Notebook
  noteId: string
  onSectionChange?: (notebookId: string, sectionId: string | null) => void
}

export function SectionSelector({
  notebook,
  noteId,
  onSectionChange,
}: SectionSelectorProps) {
  console.log(
    "SectionSelector - notebook:",
    notebook,
    "section_id:",
    notebook.section_id
  )
  const { data: sectionsList = [] } = useFetch(
    () => sections.list(notebook.id),
    [notebook.id]
  )
  const [updating, setUpdating] = useState(false)

  const handleChange = async (details: { value: string[] }) => {
    const value = details.value[0]
    const newSectionId = value === "" ? null : value

    try {
      setUpdating(true)
      await sections.assignNote(noteId, notebook.id, newSectionId)
      onSectionChange?.(notebook.id, newSectionId)
    } catch (error) {
      console.error("Error assigning note to section:", error)
    } finally {
      setUpdating(false)
    }
  }

  const items = createListCollection({
    items: [
      { label: "Unsectioned", value: "" },
      ...(sectionsList || []).map((section) => ({
        label: section.name,
        value: section.id,
      })),
    ],
  })

  return (
    <HStack justify="space-between" py={2}>
      <Text fontSize="sm" fontWeight="medium" minW="120px">
        {notebook.name}:
      </Text>
      <SelectRoot
        collection={items}
        size="sm"
        width="300px"
        value={[notebook.section_id || ""]}
        onValueChange={handleChange}
        disabled={updating}
      >
        <SelectTrigger>
          <SelectValueText placeholder="Select section" />
        </SelectTrigger>
        <SelectContent>
          {items.items.map((item: { label: string; value: string }) => (
            <SelectItem item={item} key={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </HStack>
  )
}
