import React, { useState } from "react"
import { Box, Input, Heading, VStack, Text } from "@chakra-ui/react"
import { Field } from "components/ui/field"
import { apiRequest } from "utils/http"
import { Button } from "components/ui/button"
import { useNavigate, Link } from "shared/Router"
import { userClient } from "api/users"

const RegisterPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const { call, loading, error } = apiRequest()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setErrorMessage("Please fill in all fields.")
      return
    }

    await call(() => userClient.register(username, password))

    if (!error && !loading) {
      setErrorMessage(undefined)
      navigate("/login")
    } else if (error && !loading) {
      setErrorMessage("Registration failed. Username may already exist.")
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
        Register
      </Heading>
      {errorMessage && (
        <Text color="red.500" mb={4} textAlign="center">
          {errorMessage}
        </Text>
      )}
      <form onSubmit={handleRegister}>
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
            Register
          </Button>
          <Text fontSize="sm">
            Already have an account?{" "}
            <Link
              to="/login"
              style={{ color: "var(--chakra-colors-blue-500)" }}
            >
              Login
            </Link>
          </Text>
        </VStack>
      </form>
    </Box>
  )
}

export const Component = RegisterPage
