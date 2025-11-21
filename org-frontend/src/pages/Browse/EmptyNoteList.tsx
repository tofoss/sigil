import { EmptyState } from "components/ui/empty-state"
import { LuMeh } from "react-icons/lu"

export function EmptyNoteList() {
  return (
    <EmptyState
      icon={<LuMeh />}
      title="No notes found"
      description="Try writing some"
    />
  )
}
