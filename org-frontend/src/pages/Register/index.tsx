import React, { useState } from "react"
import { Box, Input, Heading, VStack, Text } from "@chakra-ui/react"
import { Field } from "components/ui/field"
import { apiRequest } from "utils/http"
import { Button } from "components/ui/button"
import { Alert } from "components/ui/alert"
import { useNavigate, Link } from "shared/Router"
import { userClient } from "api/users"

const RegisterPage = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | undefined>()
  const { call, loading, error } = apiRequest()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password || !inviteCode) {
      setErrorMessage("Please fill in all fields.")
      return
    }

    const result = await call(() =>
      userClient.register(username, password, inviteCode)
    )

    if (result) {
      setErrorMessage(undefined)
      navigate("/login")
    } else {
      setErrorMessage(
        "Registration failed. Invalid invite code or username already exists."
      )
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
        <Alert
          status="error"
          title={errorMessage}
          mb={4}
          closable
          onClose={() => setErrorMessage(undefined)}
        />
      )}
      <form onSubmit={handleRegister}>
        <VStack>
          <Field label="Invite Code">
            <Input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter your invite code"
            />
          </Field>
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
