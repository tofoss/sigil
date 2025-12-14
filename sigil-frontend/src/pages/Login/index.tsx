import React, { useState } from "react"
import { Box, Input, Heading, VStack, Text, Alert, Button } from "@chakra-ui/react"
import { Field } from "components/ui/field"
import { apiRequest } from "utils/http"
import { useNavigate, Link } from "shared/Router"
import { userClient } from "api/users"

const LoginPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const { call, loading } = apiRequest()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setErrorMessage("Please fill in all fields.")
      return
    }

    const result = await call(() => userClient.login(username, password))

    if (result) {
      setErrorMessage(undefined)
      navigate("/")
    } else {
      setErrorMessage("Wrong username or password")
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
      {errorMessage &&
        <Alert.Root status="error" mb={4}>
          <Alert.Title>
            {errorMessage}
          </Alert.Title>
        </Alert.Root>
      }
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
          <Text fontSize="sm">
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{ color: "var(--chakra-colors-blue-500)" }}
            >
              Register
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>
  )
}

export const Component = LoginPage
