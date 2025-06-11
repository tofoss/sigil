import {
  Box,
  Card,
  Heading,
  Link as ChakraLink,
  Stack,
  HStack,
  Text,
} from "@chakra-ui/react"
import { noteClient } from "api"
import { useFetch } from "utils/http"
import { EmptyNoteList } from "./EmptyNoteList"
import { MarkdownViewer } from "modules/markdown"
import { Skeleton } from "components/ui/skeleton"
import { Link } from "shared/Router"

const BrowsePage = () => {
  const {
    data: notes,
    loading,
    error,
  } = useFetch(() => noteClient.fetchForUser())

  if (loading) {
    return <Skeleton />
  }

  if (notes === null || notes.length === 0) {
    return <EmptyNoteList />
  }

  return (
    <Box width="100%">
      <Stack>
        {notes
          .toSorted((a, b) => (a.createdAt.isBefore(b.createdAt) ? 1 : -1))
          .map((a) => {
            const lines = a.content.trim().split("\n")
            const heading =
              lines.length > 0 ? lines[0].replaceAll("#", "").trim() : a.title
            return (
              <Card.Root key={a.id} size="sm">
                <Card.Header>
                  <ChakraLink asChild>
                    <Link to={`/notes/${a.id}`}>
                      <Heading size="md">{heading}</Heading>
                    </Link>
                  </ChakraLink>
                </Card.Header>
                <Card.Body color="fg.muted">
                  <MarkdownViewer
                    text={lines
                      .filter((line) => line.trim().length > 0)
                      .slice(1, 4)
                      .join("\n")}
                  />
                  {a.tags && a.tags.length > 0 && (
                    <HStack gap={1} mt={2} wrap="wrap">
                      {a.tags.map((tag) => (
                        <Text
                          key={tag.id}
                          fontSize="xs"
                          px="2"
                          py="1"
                          borderWidth="1px"
                          borderColor="teal.300"
                          color="teal.700"
                          borderRadius="md"
                          bg="transparent"
                        >
                          {tag.name}
                        </Text>
                      ))}
                    </HStack>
                  )}
                </Card.Body>
              </Card.Root>
            )
          })}
      </Stack>
    </Box>
  )
}

export const Component = BrowsePage
