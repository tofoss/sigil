import { createSystem, defaultConfig } from "@chakra-ui/react"

export const theme = createSystem(defaultConfig, {
  strictTokens: true,
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Figtree', sans-serif` },
        body: { value: `'Figtree', sans-serif` },
      },
    },
  },
})
