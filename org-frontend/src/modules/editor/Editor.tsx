import { Box, Button, HStack, Textarea } from "@chakra-ui/react"
import { ColorModeButton } from "components/ui/color-mode"
import { MarkdownViewer } from "modules/markdown"
import { useState } from "react"
import { RiSave2Fill } from "react-icons/ri"

export function Editor() {
  const [text, setText] = useState(markdownContent)
  const [togglePreview, setTogglePreview] = useState(false)

  return (
    <Box minHeight="100vh" padding="1rem">
      <HStack>
        <Button variant="ghost" onClick={() => setTogglePreview(false)}>
          Edit
        </Button>
        <ColorModeButton />
        <Button variant="ghost" onClick={() => setTogglePreview(true)}>
          Preview
        </Button>
        <Button variant="ghost" color="green.fg" ml="auto">
          <RiSave2Fill /> Save
        </Button>
      </HStack>
      {togglePreview ? (
        <Box mt="1rem" padding="1rem" borderWidth="1px" borderRadius="md">
          <MarkdownViewer text={text} />
        </Box>
      ) : (
        <Textarea
          value={text}
          height="90vh"
          mt="1rem"
          mb="0.5rem"
          onChange={(e) => setText(e.target.value)}
        />
      )}
    </Box>
  )
}

const markdownContent: string = `
## Table Example

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
