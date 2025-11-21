import {
  Box,
  HStack,
  VStack,
  Text,
  Input,
  Button,
  Badge,
  Spinner,
} from "@chakra-ui/react"
import { Tag } from "api/model/tag"
import { tagClient } from "api/tags"
import { CloseButton } from "components/ui/close-button"
import { useState, useEffect } from "react"
import { LuPlus, LuX } from "react-icons/lu"
import { useFetch, apiRequest } from "utils/http"

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { data: allTags, loading, error } = useFetch(() => tagClient.fetchAll())
  const [tagInput, setTagInput] = useState("")
  const { call: createTag, loading: creating } = apiRequest<Tag>()

  const availableTags =
    allTags?.filter(
      (tag) => !selectedTags.some((selected) => selected.id === tag.id)
    ) || []

  const handleAddExistingTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag])
  }

  const handleRemoveTag = (tagToRemove: Tag) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagToRemove.id))
  }

  const handleCreateAndAddTag = async () => {
    if (!tagInput.trim()) return

    const inputName = tagInput.trim()

    // Check if tag already exists (case-insensitive)
    const existingTag = allTags?.find(
      (tag) => tag.name.toLowerCase() === inputName.toLowerCase()
    )

    if (existingTag) {
      // Add existing tag if not already selected
      if (!selectedTags.some((selected) => selected.id === existingTag.id)) {
        onTagsChange([...selectedTags, existingTag])
      }
      setTagInput("")
      return
    }

    // Create new tag if it doesn't exist
    try {
      const newTag = await createTag(() => tagClient.upsert(inputName))
      if (newTag) {
        onTagsChange([...selectedTags, newTag])
        setTagInput("")
      }
    } catch (error) {
      console.error("Failed to create tag:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateAndAddTag()
    }
  }

  if (loading) return <Spinner />
  if (error) return <Text color="red.500">Failed to load tags</Text>

  return (
    <VStack align="stretch" gap={4}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Selected Tags
          </Text>
          <HStack wrap="wrap" gap={2}>
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                colorPalette="teal"
                variant="outline"
                display="flex"
                alignItems="center"
                gap={1}
              >
                {tag.name}
                <CloseButton
                  size="xs"
                  onClick={() => handleRemoveTag(tag)}
                  aria-label={`Remove ${tag.name} tag`}
                />
              </Badge>
            ))}
          </HStack>
        </Box>
      )}

      {/* Add New Tag */}
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb={2}>
          Add Tag
        </Text>
        <HStack>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter tag name..."
          />
          <Button
            onClick={handleCreateAndAddTag}
            disabled={!tagInput.trim() || creating}
            colorPalette="teal"
          >
            <LuPlus />
          </Button>
        </HStack>
      </Box>

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Available Tags
          </Text>
          <HStack wrap="wrap" gap={2}>
            {availableTags.map((tag) => (
              <Button
                key={tag.id}
                size="sm"
                variant="outline"
                onClick={() => handleAddExistingTag(tag)}
              >
                {tag.name}
              </Button>
            ))}
          </HStack>
        </Box>
      )}
    </VStack>
  )
}
