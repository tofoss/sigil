import { createContext, useContext } from "react"

interface TOCContextValue {
  content: string | null
  setContent: (content: string | null) => void
}

export const TOCContext = createContext<TOCContextValue>({
  content: null,
  setContent: () => {},
})

export function useTOC() {
  return useContext(TOCContext)
}
