import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Note, Section } from "api/model"
import { SectionCard } from "./section-card"

interface SortableSectionCardProps {
  section: Section
  notebookId: string
  maxPosition: number
  onSuccess?: () => void
}

export function SortableSectionCard({
  section,
  notebookId,
  maxPosition,
  onSuccess,
}: SortableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <SectionCard
        section={section}
        notebookId={notebookId}
        maxPosition={maxPosition}
        onSuccess={onSuccess}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  )
}
