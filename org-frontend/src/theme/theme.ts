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

export const colorPalette = "teal"

export const colors = {
  contrast: `${colorPalette}.contrast`,
  fg: `${colorPalette}.fg`,
  subtle: `${colorPalette}.subtle`,
  muted: `${colorPalette}.muted`,
  emphasized: `${colorPalette}.emphasized`,
  solid: `${colorPalette}.solid`,
  focusRing: `${colorPalette}.focusRing`,
}
