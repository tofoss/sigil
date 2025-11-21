import {
  Box,
  Heading,
  Input,
  VStack,
  Text,
  Spinner,
  HStack,
} from "@chakra-ui/react"
import { Button } from "components/ui/button"
import { Alert } from "components/ui/alert"
import { useState, useEffect } from "react"
import { Field } from "components/ui/field"
import { recipeClient } from "api"
import { colorPalette } from "theme"
import type { RecipeJobResponse } from "api/model/recipe"

const RecipePage = () => {
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<RecipeJobResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    try {
      setIsSubmitting(true)
      setError(null)

      const response = await recipeClient.createFromUrl(url.trim())
      setJobId(response.jobId)
      setUrl("") // Clear the form
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recipe")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Poll for job status when we have a jobId
  useEffect(() => {
    if (!jobId) return

    const pollInterval = setInterval(async () => {
      try {
        const status = await recipeClient.getJobStatus(jobId)
        setJobStatus(status)

        // Stop polling if job is completed or failed
        if (
          status.job.status === "completed" ||
          status.job.status === "failed"
        ) {
          clearInterval(pollInterval)
        }
      } catch (err) {
        console.error("Failed to fetch job status:", err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [jobId])

  const resetForm = () => {
    setJobId(null)
    setJobStatus(null)
    setError(null)
  }

  return (
    <Box p={6} maxW="2xl" mx="auto">
      <VStack gap={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Create Recipe from URL
          </Heading>
          <Text color="fg.muted">
            Enter a URL from a recipe website to automatically extract and save
            the recipe.
          </Text>
        </Box>

        {!jobId && (
          <Box
            p={6}
            bg="bg.panel"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.muted"
          >
            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <Field
                  label="Recipe URL"
                  required
                  helperText="Enter the full URL of the recipe page"
                >
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/recipe"
                  />
                </Field>

                {error && (
                  <Alert status="error" title="Error">
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  colorPalette={colorPalette}
                  loading={isSubmitting}
                  size="lg"
                  width="100%"
                >
                  {isSubmitting ? "Creating Recipe..." : "Create Recipe"}
                </Button>
              </VStack>
            </form>
          </Box>
        )}

        {jobStatus && (
          <Box
            p={6}
            bg="bg.panel"
            borderRadius="lg"
            border="1px solid"
            borderColor="border.muted"
          >
            <VStack gap={4} align="stretch">
              <HStack>
                <Text fontWeight="bold">Status:</Text>
                {jobStatus.job.status === "pending" && (
                  <HStack>
                    <Spinner size="sm" />
                    <Text color="colorPalette.500">Queued</Text>
                  </HStack>
                )}
                {jobStatus.job.status === "processing" && (
                  <HStack>
                    <Spinner size="sm" />
                    <Text color="colorPalette.500">Processing...</Text>
                  </HStack>
                )}
                {jobStatus.job.status === "completed" && (
                  <Text color="green.500">✓ Completed</Text>
                )}
                {jobStatus.job.status === "failed" && (
                  <Text color="red.500">✗ Failed</Text>
                )}
              </HStack>

              {jobStatus.job.status === "failed" &&
                jobStatus.job.errorMessage && (
                  <Alert status="error" title="Processing Failed">
                    {jobStatus.job.errorMessage}
                  </Alert>
                )}

              {jobStatus.job.status === "completed" && jobStatus.recipe && (
                <Box>
                  <Alert status="success" title="Recipe Created Successfully!">
                    {jobStatus.recipe.name} has been saved to your notes.
                  </Alert>

                  <Box mt={4} p={4} bg="bg.subtle" borderRadius="md">
                    <Text fontWeight="bold" mb={2}>
                      {jobStatus.recipe.name}
                    </Text>
                    {jobStatus.recipe.summary && (
                      <Text mb={2} fontSize="sm" color="fg.muted">
                        {jobStatus.recipe.summary}
                      </Text>
                    )}
                    <HStack gap={4} fontSize="sm" color="fg.muted">
                      {jobStatus.recipe.servings && (
                        <Text>Serves: {jobStatus.recipe.servings}</Text>
                      )}
                      {jobStatus.recipe.prepTime && (
                        <Text>Prep: {jobStatus.recipe.prepTime}</Text>
                      )}
                    </HStack>
                  </Box>

                  {/*jobStatus.note && (
                    <Button
                      as="a"
                      href={`/notes/${jobStatus.note.id}`}
                      colorPalette={colorPalette}
                      mt={4}
                      size="sm"
                    >
                      View Recipe Note
                    </Button>
                  )*/}
                </Box>
              )}

              <Button variant="outline" onClick={resetForm} size="sm">
                Create Another Recipe
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  )
}

export const Component = RecipePage

export const ErrorBoundary = () => {
  return <p>500 - Recipe page error</p>
}
