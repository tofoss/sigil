import "@testing-library/jest-dom/vitest"

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

const originalConsoleError = console.error
console.error = (...args: unknown[]) => {
  const [message] = args
  if (
    typeof message === "string" &&
    message.includes("Could not parse CSS stylesheet")
  ) {
    return
  }
  originalConsoleError(...args)
}
