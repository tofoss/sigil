import React, { useState } from "react"
import { Box, Input, Heading, VStack, Text } from "@chakra-ui/react"
import { Field } from "components/ui/field"
import { apiRequest } from "utils/http"
import { Button } from "components/ui/button"
import { useNavigate } from "shared/Router"
import { userClient } from "api/users"

const LoginPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const { call, loading, error } = apiRequest()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setErrorMessage("Please fill in all fields.")
      return
    }

    await call(() => userClient.login(username, password))

    if (!error && !loading) {
      setErrorMessage(undefined)
      navigate("/")
    } else if (error && !loading) {
      setErrorMessage("Wrong username or password")
    } else {
      setErrorMessage(undefined)
    }
  }

  return (
    <Box
      maxW="sm"
      mx="auto"
      mt={10}
      p={6}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Heading as="h1" size="lg" textAlign="center" mb={6}>
        Login
      </Heading>
      {errorMessage && (
        <Text color="red.500" mb={4} textAlign="center">
          {errorMessage}
        </Text>
      )}
      <form onSubmit={handleLogin}>
        <VStack>
          <Field label="Username">
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" width="full" loading={loading}>
            Login
          </Button>
        </VStack>
      </form>
    </Box>
  )
}

export const Component = LoginPage
