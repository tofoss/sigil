/* eslint-disable no-console */
import {
  Blockquote,
  Box,
  Code,
  CodeBlock,
  createShikiAdapter,
  Heading,
  IconButton,
  Image,
  Link,
  List,
  Table,
  Checkbox,
  CheckboxCheckedChangeDetails,
  ClientOnly,
} from "@chakra-ui/react"
import ReactMarkdown from "react-markdown"
import { LuExternalLink } from "react-icons/lu"
import remarkGfm from "remark-gfm"
import React, { ReactNode, useEffect } from "react"
import { useLocation } from "shared/Router"
import { useColorMode } from "components/ui/color-mode"
import type { HighlighterGeneric } from "shiki"

interface Props {
  text: string
  isShoppingList?: boolean
  onCheckboxClick?: (idx: number, checked: boolean) => void
}

// Create Shiki adapter for syntax highlighting with light/dark theme support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shikiAdapter = createShikiAdapter<HighlighterGeneric<any, any>>({
  async load() {
    const { createHighlighter } = await import("shiki")
    return createHighlighter({
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "python",
        "java",
        "csharp",
        "rust",
        "go",
        "kotlin",
        "sql",
        "lua",
        "yaml",
        "json",
        "html",
        "css",
        "bash",
        "shell",
        "markdown",
      ],
      themes: ["poimandres", "github-light"],
    })
  },
  theme: {
    light: "github-light",
    dark: "poimandres",
  },
})

export function MarkdownViewer({ text, isShoppingList = false, onCheckboxClick }: Props) {
  const { hash: url } = useLocation()
  const listItemCounter = React.useRef(0);
  const listItemIds = React.useRef(new Map<ReactNode, number>());

  useEffect(() => {
    if (!url) return

    const id = url.split("#")[1]
    if (!id) return

    const el = document.getElementById(id)

    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }, [url]);

  function extractText(children: React.ReactNode): string {
    if (!children) return ''

    if (typeof children === 'string') {
      return children
    }

    if (typeof children === 'number') {
      return String(children)
    }

    if (Array.isArray(children)) {
      return children.map(extractText).join('')
    }

    if (React.isValidElement(children)) {
      const props = children.props as { children?: React.ReactNode };
      if (props.children) {
        return extractText(props.children);
      }
    }

    return ''
  }

  function id(children: React.ReactNode): string {
    const text = extractText(children);
    return normalizeHeadingID(text)
  }

  // Reset counter at start of each render for consistent IDs
  listItemCounter.current = 0;
  listItemIds.current.clear();

  return (
    <Box maxWidth="100%" width="100%" minWidth="0">
      <CodeBlock.AdapterProvider value={shikiAdapter}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
          h1: ({ node, ...props }) => (
            <a href={`#${id(props.children)}`}><Heading as="h1" size="2xl" my={4} id={id(props.children)} {...props} /></a>
          ),
          h2: ({ node, ...props }) => (
            <a href={`#${id(props.children)}`}><Heading as="h2" size="xl" my={4} id={id(props.children)} {...props} /></a>
          ),
          h3: ({ node, ...props }) => (
            <a href={`#${id(props.children)}`}><Heading as="h3" size="lg" my={3} id={id(props.children)} {...props} /></a>
          ),
          h4: ({ node, ...props }) => (
            <a href={`#${id(props.children)}`}><Heading as="h4" size="md" my={3} id={id(props.children)} {...props} /></a>
          ),
          p: ({ node, ...props }) => (
            <Box as="p" my={2} whiteSpace="pre-wrap" {...props} />
          ),
          a: ({ node, children, ...props }) => (
            <Link
              color="teal.500"
              _hover={{ color: "teal.700" }}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              <Box as="span" display="inline-flex" alignItems="center">
                {children} <LuExternalLink />
              </Box>
            </Link>
          ),
          blockquote: ({ node, ...props }) => (
            <Blockquote.Root>
              <Blockquote.Content>
                {props.children}
              </Blockquote.Content>
            </Blockquote.Root>
          ),
          ul: ({ node, ...props }) => <List.Root {...props} />,
          ol: ({ node, ...props }) => <List.Root as="ol" {...props} />,
          li: ({ node, ...props }) => {
            // Get or assign ID for this list item (handles React double-rendering)
            let itemId = listItemIds.current.get(node);
            if (itemId === undefined) {
              itemId = listItemCounter.current++;
              listItemIds.current.set(node, itemId);
            }

            // Check if this is a task list item (has a checkbox)
            const children = props.children
            if (Array.isArray(children) && children.length > 0) {
              const firstChild = children[0]
              // remarkGfm creates task lists with an input checkbox
              if (React.isValidElement(firstChild) && firstChild.type === 'input' &&
                (firstChild.props as { type?: string }).type === 'checkbox') {
                const checked = (firstChild.props as { checked?: boolean }).checked || false
                const restChildren = children.slice(1)

                // For shopping lists, use larger, more touch-friendly checkboxes
                if (isShoppingList) {
                  return (
                    <List.Item
                      id={String(itemId)}
                      ml="0"
                      py={3}
                      display="flex"
                      alignItems="center"
                      fontSize="lg"
                      {...props}
                    >
                      <Checkbox.Root
                        size="lg"
                        defaultChecked={checked}
                        colorPalette="teal"
                        variant="outline"
                        onCheckedChange={(d: CheckboxCheckedChangeDetails) => {
                          if (d.checked === "indeterminate" || !onCheckboxClick) {
                            return
                          }
                          onCheckboxClick(itemId!, d.checked)
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontWeight="600" fontSize="1.125rem" ml={1}>
                          {restChildren}
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </List.Item>
                  )
                } else {
                  // Regular task list item
                  return (
                    <List.Item id={String(itemId)} ml="1rem" display="flex" alignItems="center" {...props}>
                      <Checkbox.Root
                        size="md"
                        mt={1}
                        defaultChecked={checked}
                        colorPalette="teal"
                        variant="outline"
                        onCheckedChange={(d: CheckboxCheckedChangeDetails) => {
                          if (d.checked === "indeterminate" || !onCheckboxClick) {
                            return
                          }
                          onCheckboxClick(itemId!, d.checked)
                        }}
                      >

                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>
                          {restChildren}
                        </Checkbox.Label>
                      </Checkbox.Root>
                    </List.Item>
                  )
                }
              }
            }
            // Regular list item
            return <List.Item id={String(itemId)} ml="1rem" {...props} />
          },
          strong: ({ node, ...props }) => (
            <Box as="strong" fontWeight="bold" {...props} />
          ),
          em: ({ node, ...props }) => (
            <Box as="em" fontStyle="italic" {...props} />
          ),
          pre: ({ node, ...props }) => <CodeViewer {...props} />,
          code: ({ node, ...props }) => (
            <Code
              as="code"
              size={"md"}
              borderRadius="sm"
              overflow="auto"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <Table.Root
              bg="bg.subtle"
              variant="line"
              interactive
              my={4}
              {...props}
            />
          ),
          thead: ({ node, ...props }) => <Table.Header {...props} />,
          tbody: ({ node, ...props }) => <Table.Body {...props} />,
          tr: ({ node, ...props }) => <Table.Row {...props} />,
          th: ({ node, ...props }) => (
            <Table.ColumnHeader bg="bg.panel" fontWeight="bold" {...props} />
          ),
          td: ({ node, ...props }) => <Table.Cell bg="bg.panel" {...props} />,
          img: ({ node, src, alt, ...props }) => {
            const useCredentials = src?.startsWith("/files/")
            return (
              <Image
                src={src}
                alt={alt}
                maxW="100%"
                height="auto"
                my={4}
                borderRadius="md"
                crossOrigin={useCredentials ? "use-credentials" : undefined}
                {...props}
              />
            )
          },
        }}
        >
          {text}
        </ReactMarkdown>
      </CodeBlock.AdapterProvider>
    </Box>
  )
}

// Shiki theme background colors (extracted from theme definitions)
const SHIKI_THEME_BACKGROUNDS = {
  "poimandres": "#1b1e28",
  "github-light": "#fff",
} as const

function CodeViewer(props: { children?: React.ReactNode }) {
  const { colorMode } = useColorMode()
  const codeElement = React.Children.only(props.children) as React.ReactElement<{
    className?: string
    children?: React.ReactNode
  }>

  // Extract language from className (format: "language-xxx")
  const className = codeElement.props.className || ""
  const match = /language-(\w+)/.exec(className)
  const language = match ? match[1] : undefined

  // Extract the actual code text
  const code = typeof codeElement.props.children === "string" 
    ? codeElement.props.children 
    : ""

  // Get the background color from the Shiki theme
  const themeBg = colorMode === "dark" 
    ? SHIKI_THEME_BACKGROUNDS["poimandres"] 
    : SHIKI_THEME_BACKGROUNDS["github-light"]

  return (
    <ClientOnly fallback={<Code as="pre" p={4}>{code}</Code>}>
      {() => (
        <CodeBlock.Root 
          code={code} 
          language={language ?? "sql"} 
          my={4}
          meta={{ colorScheme: colorMode }}
          colorPalette="teal"
          bg={themeBg}
        >
          <CodeBlock.Header>
            <CodeBlock.Title>{language}</CodeBlock.Title>
            <CodeBlock.CopyTrigger asChild>
              <IconButton variant="ghost" size="2xs">
                <CodeBlock.CopyIndicator />
              </IconButton>
            </CodeBlock.CopyTrigger>
          </CodeBlock.Header>
          <CodeBlock.Content>
            <CodeBlock.Code>
              <CodeBlock.CodeText />
            </CodeBlock.Code>
          </CodeBlock.Content>
        </CodeBlock.Root>
      )}
    </ClientOnly>
  )
}

export function normalizeHeadingID(text: string) {
  return text
    .toLowerCase()
    .replaceAll(/[^\w\s-]/g, '') // remove special chars
    .replaceAll(/\s+/g, '-')      // spaces to hyphens
    .replaceAll(/-+/g, '-')       // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim hyphens from ends
}
