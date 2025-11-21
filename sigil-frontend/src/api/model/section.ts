// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"

export interface Section {
  id: string
  notebook_id: string
  name: string
  position: number
  created_at: Dayjs
  updated_at: Dayjs
}

export function fromJson(section: Section): Section {
  return {
    ...section,
    created_at: dayjs(section.created_at),
    updated_at: dayjs(section.updated_at),
  }
}
