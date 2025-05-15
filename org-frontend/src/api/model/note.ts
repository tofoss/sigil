// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  createdAt: Dayjs
  updatedAt: Dayjs
  publishedAt: Dayjs | undefined
  published: boolean
  isEditable?: boolean
}

export function fromJson(note: Note): Note {
  return {
    ...note,
    createdAt: dayjs(note.createdAt),
    updatedAt: dayjs(note.updatedAt),
    publishedAt: note.publishedAt ? dayjs(note.publishedAt) : undefined,
  }
}
