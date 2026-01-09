import { CodeBlock, createShikiAdapter, IconButton } from "@chakra-ui/react"
import { useColorMode } from "components/ui/color-mode"
import React from "react"
import type { HighlighterGeneric } from "shiki"
import { createHighlighter } from "shiki"


// Shiki theme background colors (extracted from theme definitions)
const SHIKI_THEME_BACKGROUNDS = {
  "poimandres": "#1b1e28",
  "github-light": "#fff",
} as const

const supportedLanguages = [
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
]
// Create Shiki adapter for syntax highlighting with light/dark theme support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const shikiAdapter = createShikiAdapter<HighlighterGeneric<any, any>>({
  async load() {
    return createHighlighter({
      langs: supportedLanguages,
      themes: ["poimandres", "github-light"],
    })
  },
  theme: {
    light: "github-light",
    dark: "poimandres",
  },
})


export function CodeViewer(props: { children?: React.ReactNode }) {
  const { colorMode } = useColorMode()
  const codeElement = React.Children.only(props.children) as React.ReactElement<{
    className?: string
    children?: React.ReactNode
  }>

  // Extract language from className (format: "language-xxx")
  const className = codeElement.props.className || ""
  const match = /language-(\w+)/.exec(className)
  const language = match && supportedLanguages.includes(match[1]) ? match[1] : undefined

  // Extract the actual code text
  const code = typeof codeElement.props.children === "string"
    ? codeElement.props.children
    : ""

  // Get the background color from the Shiki theme
  const themeBg = colorMode === "dark"
    ? SHIKI_THEME_BACKGROUNDS["poimandres"]
    : SHIKI_THEME_BACKGROUNDS["github-light"]

  return (
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
  )
}
