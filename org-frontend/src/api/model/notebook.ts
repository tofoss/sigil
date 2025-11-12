// eslint-disable-next-line no-restricted-imports
import dayjs, { Dayjs } from "dayjs"

export interface Notebook {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: Dayjs
  updated_at: Dayjs
  section_id?: string // Section assignment when note is in this notebook
}

export function fromJson(notebook: Notebook): Notebook {
  return {
    ...notebook,
    created_at: dayjs(notebook.created_at),
    updated_at: dayjs(notebook.updated_at),
  }
}
