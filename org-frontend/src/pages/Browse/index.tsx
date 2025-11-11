import { useState, useEffect } from "react"
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
import { Note } from "api/model/note"
import { useFetch } from "utils/http"
import { EmptyNoteList } from "./EmptyNoteList"
import { MarkdownViewer } from "modules/markdown"
import { Skeleton } from "components/ui/skeleton"
import { Link, useSearchParams } from "shared/Router"
import { Button } from "components/ui/button"
import { EmptyState } from "components/ui/empty-state"
import { LuSearch } from "react-icons/lu"

const RESULTS_PER_PAGE = 50

const BrowsePage = () => {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const [offset, setOffset] = useState(0)
  const [allResults, setAllResults] = useState<Note[]>([])

  // Reset offset when search query changes
  useEffect(() => {
    setOffset(0)
    setAllResults([])
  }, [searchQuery])

  const {
    data: notes,
    loading,
    error,
  } = useFetch(
    () => noteClient.search(searchQuery, RESULTS_PER_PAGE, offset),
    [searchQuery, offset]
  )

  // Accumulate results when loading more
  useEffect(() => {
    if (notes && notes.length > 0) {
      if (offset === 0) {
        setAllResults(notes)
      } else {
        setAllResults((prev) => {
          const combined = [...prev]
          notes.forEach((note) => {
            if (!combined.find((n) => n.id === note.id)) {
              combined.push(note)
            }
          })
          return combined
        })
      }
    }
  }, [notes, offset])

  const displayNotes = allResults

  if (loading && offset === 0) {
    return <Skeleton />
  }

  // Show empty results when search returns nothing
  if (!loading && displayNotes.length === 0) {
    return (
      <EmptyState
        icon={<LuSearch />}
        title="No notes found"
        description={
          searchQuery
            ? `No notes match "${searchQuery}"`
            : "You don't have any notes yet"
        }
      />
    )
  }

  const hasMore = notes && notes.length === RESULTS_PER_PAGE

  const handleLoadMore = () => {
    setOffset((prev) => prev + RESULTS_PER_PAGE)
  }

  return (
    <Box width="100%">
      <Stack gap={4}>
        {displayNotes.map((a) => {
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

        {/* Load More Button */}
        {hasMore && (
          <Box textAlign="center" py={4}>
            <Button
              onClick={handleLoadMore}
              loading={loading}
              disabled={loading}
            >
              Load More
            </Button>
          </Box>
        )}

        {/* Show skeleton while loading more */}
        {loading && offset > 0 && <Skeleton height="100px" />}
      </Stack>
    </Box>
  )
}

export const Component = BrowsePage
