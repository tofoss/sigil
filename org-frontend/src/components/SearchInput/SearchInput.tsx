import { useEffect, useState } from "react"
import { Input } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"
import { useDebounce } from "utils/hooks"
import { InputGroup } from "components/ui/input-group"
import { useNavigate, useSearchParams, useLocation } from "shared/Router"

interface SearchInputProps {
  /** Placeholder text for the input */
  placeholder?: string
  /** Additional CSS class names */
  className?: string
}

/**
 * SearchInput component that provides debounced search functionality.
 *
 * Features:
 * - Debounced input (300ms) to reduce API calls when on Browse page
 * - Auto-navigates to Browse page on typing (only when already on Browse page)
 * - Press Enter to navigate to Browse page from other pages
 * - Syncs with URL query param on mount
 * - Search icon prefix
 */
export function SearchInput({
  placeholder = "Search notes...",
  className,
}: SearchInputProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const debouncedQuery = useDebounce(query, 300)

  const isBrowsePage = location.pathname === "/notes/browse"

  // Auto-navigate only when on Browse page (debounced)
  useEffect(() => {
    if (!isBrowsePage) return

    if (debouncedQuery) {
      navigate(`/notes/browse?q=${encodeURIComponent(debouncedQuery)}`)
    } else if (query === "" && searchParams.get("q")) {
      // If query is cleared, navigate to browse without query param
      navigate("/notes/browse")
    }
  }, [debouncedQuery, navigate, query, searchParams, isBrowsePage])

  // Handle Enter key press to navigate from other pages
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isBrowsePage) {
      if (query) {
        navigate(`/notes/browse?q=${encodeURIComponent(query)}`)
      } else {
        navigate("/notes/browse")
      }
    }
  }

  return (
    <InputGroup className={className} startElement={<LuSearch />}>
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        size="sm"
      />
    </InputGroup>
  )
}
