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

export function Editor() {
  const [article, setArticle] = useState<Article | undefined>(undefined)
  const [text, setText] = useState(article?.articleContent ?? markdownContent)
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
      articleClient.upsert(text, article?.articleId)
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
                  <DataListItem label="id" value={article.articleId} />
                  <DataListItem label="user" value={article.articleUserId} />
                  <DataListItem
                    label="created at"
                    value={article.articleCreatedAt.toString()}
                  />
                  <DataListItem
                    label="updated at"
                    value={article.articleUpdatedAt.toString()}
                  />
                  <DataListItem
                    label="published"
                    value={article.articlePublished.toString()}
                  />
                  {article.articlePublishedAt && (
                    <DataListItem
                      label="published at"
                      value={article.articlePublishedAt.toString()}
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

const markdownContent: string = `
# Table Example

| Feature        | Support           | Notes       |
| -------------- | ----------------- | ----------- |
| Tables         | ✅                | Via GFM     |
| Task Lists     | ✅                | - [ ] Item  |
| Strikethrough  | ~~Not Supported~~ | ~~Yes~~     |

## Task List Example

- [x] Completed task
- [ ] Incomplete task

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

---

This is a **strong** (bold) text and this is an *emphasized* (italic) text.

Here's a [link](https://www.example.com) to an external website.

> This is a blockquote. It can be used to highlight quotes or important information.

This is a line of inline code: \`const greeting = "Hello, world!";\`.

And here is a code block:

\`\`\`kotlin
fun foo() {
	val foo = "foo"
	val bar = "bar"
	println(foo + bar)
}
\`\`\`

Here is a horizontal rule:

---

This is an image:

![Alt text](https://via.placeholder.com/150)

Here is an unordered list:

- First item
- Second item
- **Third item** with bold text
  - Nested item 1
  - *Nested item 2 with italic text*

Here is an ordered list:

1. Item one
2. Item two
   1. Sub-item one
   2. Sub-item two
3. Item three

Here is a line break:  
This sentence is on a new line.

And finally, a paragraph:

This is a paragraph that explains something important. It should show up as a block of text with proper spacing between other elements.
`
