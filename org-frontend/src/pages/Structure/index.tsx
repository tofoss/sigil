import { Box, HStack, Heading, Input, Field, List } from "@chakra-ui/react"
import { Tag } from "api/model/tag"
import { tagClient } from "api/tags"
import { Button } from "components/ui/button"
import { useEffect, useState } from "react"
import { apiRequest, useFetch } from "utils/http"

const structurePage = () => {
  const { data: tagData, loading, error } = useFetch(() => tagClient.fetchAll())
  const [tags, setTags] = useState<Tag[]>(tagData ?? [])
  const [tagInput, setTagInput] = useState<string>("")
  const { call, loading: tagLoading, error: tagError } = apiRequest<Tag>()

  useEffect(() => {
    setTags(tagData ?? [])
  }, [tagData])

  const onTagAdd = async () => {
    const tag = await call(() => tagClient.upsert(tagInput))
    setTags((prev) => [...prev.filter((t) => t.name != tag?.name), tag!])
  }

  return (
    <Box width="100%">
      <Heading as="h1">Structuring</Heading>
      <Box>
        <Heading as="h2" size="md">
          Tags
        </Heading>
        <Field.Root>
          <Field.Label>Add new tag</Field.Label>
          <HStack>
            <Input onChange={(e) => setTagInput(e.target.value)}></Input>
            <Button onClick={onTagAdd}>Add</Button>
          </HStack>
        </Field.Root>
        <Box>
          <List.Root>
            {tags.map((t) => (
              <List.Item key={t.id}>{t.name}</List.Item>
            ))}
          </List.Root>
        </Box>
      </Box>
    </Box>
  )
}
export const Component = structurePage
