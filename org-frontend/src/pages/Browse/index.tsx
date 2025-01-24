import { Box, Card, Heading, Stack } from "@chakra-ui/react"
import { articleClient } from "api"
import { useFetch } from "utils/http"
import { EmptyArticleList } from "./EmptyArticleList"
import { MarkdownViewer } from "modules/markdown"
import { Skeleton } from "components/ui/skeleton"

const BrowsePage = () => {
  const {
    data: articles,
    loading,
    error,
  } = useFetch(() => articleClient.fetchForUser())

  if (loading) {
    return <Skeleton />
  }

  if (articles === null || articles.length === 0) {
    return <EmptyArticleList />
  }

  return (
    <Box width="100%">
      <Stack>
        {articles
          .toSorted((a, b) =>
            a.articleCreatedAt.isBefore(b.articleCreatedAt) ? 1 : -1
          )
          .map((a) => {
            const lines = a.articleContent.trim().split("\n")
            const heading =
              lines.length > 0
                ? lines[0].replaceAll("#", "").trim()
                : a.articleTitle
            return (
              <Card.Root key={a.articleId} size="sm">
                <Card.Header>
                  <Heading size="md">{heading}</Heading>
                </Card.Header>
                <Card.Body color="fg.muted">
                  <MarkdownViewer
                    text={lines
                      .filter((line) => line.trim().length > 0)
                      .slice(1, 4)
                      .join("\n")}
                  />
                </Card.Body>
              </Card.Root>
            )
          })}
      </Stack>
    </Box>
  )
}

export const Component = BrowsePage
