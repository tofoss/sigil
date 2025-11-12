import { useSortable } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Note, Section } from "api/model"
import { SectionCard } from "./section-card"

interface SortableSectionCardProps {
  section: Section
  notebookId: string
  maxPosition: number
  onSuccess?: () => void
  refreshKey?: number
}

export function SortableSectionCard({
  section,
  notebookId,
  maxPosition,
  onSuccess,
  refreshKey,
}: SortableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.id,
    data: {
      type: "section-sort",
    },
  })

  // Also make this section droppable for notes
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: "section",
      sectionId: section.id,
      notebookId,
    },
  })

  // Combine both refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node)
    setDroppableRef(node)
  }

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
        isOver={isOver}
        refreshKey={refreshKey}
      />
    </div>
  )
}
