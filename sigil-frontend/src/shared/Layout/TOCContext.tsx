import { createContext, useContext } from "react"

interface TOCContextValue {
  content: string | null
  hasHeadings: boolean
  setContent: (content: string | null) => void
}

export const TOCContext = createContext<TOCContextValue>({
  content: null,
  hasHeadings: false,
  setContent: () => {},
})

export function useTOC() {
  return useContext(TOCContext)
}
