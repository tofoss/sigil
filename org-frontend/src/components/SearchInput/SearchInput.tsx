import { useEffect, useState } from "react"
import { Input } from "@chakra-ui/react"
import { LuSearch } from "react-icons/lu"
import { useDebounce } from "utils/hooks"
import { InputGroup } from "components/ui/input-group"
import { useNavigate, useSearchParams } from "shared/Router"

interface SearchInputProps {
  /** Placeholder text for the input */
  placeholder?: string
  /** Additional CSS class names */
  className?: string
}

/**
 * SearchInput component that provides debounced search functionality.
 * Automatically navigates to /notes/browse with search query parameter.
 *
 * Features:
 * - Debounced input (300ms) to reduce API calls
 * - Navigates to Browse page with query parameter
 * - Syncs with URL query param on mount
 * - Search icon prefix
 */
export function SearchInput({
  placeholder = "Search notes...",
  className,
}: SearchInputProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const debouncedQuery = useDebounce(query, 300)

  // Navigate to browse page with search query when debounced value changes
  useEffect(() => {
    if (debouncedQuery) {
      navigate(`/notes/browse?q=${encodeURIComponent(debouncedQuery)}`)
    } else if (query === "" && searchParams.get("q")) {
      // If query is cleared, navigate to browse without query param
      navigate("/notes/browse")
    }
  }, [debouncedQuery, navigate, query, searchParams])

  return (
    <InputGroup className={className} startElement={<LuSearch />}>
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="sm"
      />
    </InputGroup>
  )
}
