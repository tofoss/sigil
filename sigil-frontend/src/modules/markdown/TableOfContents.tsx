import { Box, Link, VStack } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { Heading, useHeadingExtraction } from "./useHeadingExtraction"

interface TableOfContentsProps {
  content: string
  isVisible: boolean
}

export function TableOfContents({ content, isVisible }: TableOfContentsProps) {
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  const headings = useHeadingExtraction(content)

  // Track active heading using Intersection Observer
  useEffect(() => {
    if (!isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first heading that's intersecting
        const intersecting = entries.find((entry) => entry.isIntersecting)
        if (intersecting) {
          setActiveHeadingId(intersecting.target.id)
        }
      },
      {
        // Trigger when heading is near top of viewport
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    )

    // Observe all heading elements
    const headingElements = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id]")
    headingElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [isVisible, content])

  if (!isVisible) return null

  // Render heading and its children recursively
  const renderHeading = (heading: Heading, depth: number = 0, index: number = 0) => {
    const isActive = activeHeadingId === heading.id
    const indent = depth * 12

    return (
      <Box key={`${heading.id}-${index}`} width="100%">
        <Link
          href={`#${heading.id}`}
          fontSize="sm"
          color={isActive ? "teal.500" : "fg.muted"}
          fontWeight={isActive ? "semibold" : "normal"}
          _hover={{ color: "teal.700" }}
          pl={`${indent}px`}
          py={1}
          display="block"
          borderRadius="md"
          transition="all 0.15s"
          overflow="hidden"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
          title={heading.text}
        >
          {heading.text}
        </Link>
        {heading.children.map((child, childIndex) => renderHeading(child, depth + 1, childIndex))}
      </Box>
    )
  }

  return (
    <Box
      width="260px"
      minWidth="260px"
      maxWidth="260px"
      height="100vh"
      position="sticky"
      top="0"
      overflowY="auto"
      bg="bg.panel"
      className="custom-scrollbar"
      p={4}
    >
      <VStack key={content.substring(0, 100)} align="start" gap={0} width="100%">
        {headings.map((heading, index) => renderHeading(heading, 0, index))}
      </VStack>
    </Box>
  )
}
