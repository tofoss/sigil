import { EmptyState } from "components/ui/empty-state"
import { LuMeh } from "react-icons/lu"

export function EmptyArticleList() {
  return (
    <EmptyState
      icon={<LuMeh />}
      title="No articles found"
      description="Try writing some"
    />
  )
}
