import {
  Box,
  Code,
  CodeProps,
  Heading,
  Image,
  Link,
  List,
  Table,
} from "@chakra-ui/react"
import ReactMarkdown from "react-markdown"
import { LuExternalLink } from "react-icons/lu"
import rehypePrism from "rehype-prism"
import "prismjs/themes/prism-okaidia.css"
import "prismjs/components/prism-python"
import "prismjs/components/prism-java"
import "prismjs/components/prism-typescript"
import "prismjs/components/prism-csharp"
import "prismjs/components/prism-rust"
import "prismjs/components/prism-go"
import "prismjs/components/prism-kotlin"
import "prismjs/components/prism-sql"
import "prismjs/components/prism-lua"
import "prismjs/components/prism-yaml"
import "prismjs/components/prism-json"
import remarkGfm from "remark-gfm"
import { Blockquote } from "components/ui/blockquote"
import React from "react"
import { theme } from "theme"

interface Props {
  text: string
}

export function MarkdownViewer({ text }: Props) {
  return (
    <Box maxWidth="100%" width="100%" minWidth="0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypePrism]}
        components={{
          h1: ({ node, ...props }) => (
            <Heading as="h1" size="2xl" my={4} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <Heading as="h2" size="xl" my={4} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <Heading as="h3" size="lg" my={3} {...props} />
          ),
          h4: ({ node, ...props }) => (
            <Heading as="h4" size="md" my={3} {...props} />
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
            <Blockquote>{props.children}</Blockquote>
          ),
          ul: ({ node, ...props }) => <List.Root {...props} />,
          ol: ({ node, ...props }) => <List.Root as="ol" {...props} />,
          li: ({ node, ...props }) => <List.Item ml="1rem" {...props} />,
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
    </Box>
  )
}

function CodeViewer(props: CodeProps) {
  const codeElement = React.Children.only(props.children) as React.ReactElement

  // Override display to block for proper rendering
  const updatedCodeElement = React.cloneElement(codeElement, {
    style: { ...codeElement.props.style, display: "block" },
  })

  return (
    <Code
      as="pre"
      size="lg"
      fontSize="1rem"
      color="white"
      p={4}
      borderRadius="sm"
      width="100%"
      maxWidth="100%"
      overflow="auto"
      overflowX="auto"
      display="block"
      style={{
        background: theme.token("colors.gray.900"),
        boxSizing: "border-box",
      }}
    >
      {updatedCodeElement}
    </Code>
  )
}
