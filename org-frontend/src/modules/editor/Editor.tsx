/* eslint-disable no-console */
import {
  Box,
  HStack,
  Textarea,
  Text,
  Collapsible,
  VStack,
} from "@chakra-ui/react"
import { Button } from "components/ui/button"
import { articleClient } from "api"
import { MarkdownViewer } from "modules/markdown"
import { useEffect, useRef, useState } from "react"
import { LuFileEdit, LuInfo, LuPresentation, LuSave } from "react-icons/lu"
import { colorPalette } from "theme"
import { apiRequest } from "utils/http"
import { Article } from "api/model/article"
import { DataListItem, DataListRoot } from "components/ui/data-list"

interface EditorProps {
  article?: Article
  mode: "Display" | "Edit"
}

export function Editor() {
  const [article, setArticle] = useState<Article | undefined>(undefined)
  const [text, setText] = useState(article?.content ?? "")
  const [togglePreview, setTogglePreview] = useState(false)
  const { call, loading, error } = apiRequest<Article>()

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  useEffect(() => {
    adjustHeight()
    adjustHeight()
  }, [togglePreview])

  const onSave = async () => {
    const updatedArticle = await call(() =>
      articleClient.upsert(text, article?.id)
    )
    if (updatedArticle === undefined) {
      console.error("Article is undefined")
      return
    }

    setArticle(updatedArticle)
  }

  return (
    <Box minHeight="100vh" pl="0.5rem" pr="0.5rem" width="100%">
      <Collapsible.Root>
        <VStack width="100%">
          <HStack width="100%">
            <Button variant="ghost" onClick={() => setTogglePreview(false)}>
              <LuFileEdit /> Edit
            </Button>
            <Button variant="ghost" onClick={() => setTogglePreview(true)}>
              <LuPresentation /> Preview
            </Button>
            {article && (
              <Collapsible.Trigger paddingY="3">
                <Button variant="ghost">
                  <LuInfo /> Metadata
                </Button>
              </Collapsible.Trigger>
            )}
            <Button
              variant="ghost"
              colorPalette={colorPalette}
              ml="auto"
              onClick={onSave}
              loading={loading}
            >
              <LuSave /> Save
            </Button>
          </HStack>
          {article && (
            <Collapsible.Content width="100%">
              <Box paddingLeft="4">
                <DataListRoot orientation="horizontal" size="sm">
                  <DataListItem label="id" value={article.id} />
                  <DataListItem label="user" value={article.userId} />
                  <DataListItem
                    label="created at"
                    value={article.createdAt.toString()}
                  />
                  <DataListItem
                    label="updated at"
                    value={article.updatedAt.toString()}
                  />
                  <DataListItem
                    label="published"
                    value={article.published.toString()}
                  />
                  {article.publishedAt && (
                    <DataListItem
                      label="published at"
                      value={article.publishedAt.toString()}
                    />
                  )}
                </DataListRoot>
              </Box>
            </Collapsible.Content>
          )}
        </VStack>
      </Collapsible.Root>
      {error && (
        <Text color="red.500" mb={4} textAlign="center">
          {error.message}
        </Text>
      )}
      {togglePreview ? (
        <Box mt="1rem" padding="1rem" borderWidth="1px" borderRadius="md">
          <MarkdownViewer text={text} />
        </Box>
      ) : (
        <Textarea
          ref={textareaRef}
          value={text}
          mt="1rem"
          mb="0.5rem"
          resize="none"
          onInput={adjustHeight}
          onChange={(e) => setText(e.target.value)}
          overflow="hidden"
          minHeight="80vh"
        />
      )}
    </Box>
  )
}
