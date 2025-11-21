// eslint-disable-next-line no-restricted-imports
import dayjs from "dayjs"
import { client } from "./client"
import { Note } from "./model/note"
import { Section, fromJson } from "./model/section"
import { commonHeaders } from "./utils"

export const sections = {
  // List all sections in a notebook (ordered by position)
  list: async (notebookId: string): Promise<Section[]> => {
    const response = await client
      .get(`notebooks/${notebookId}/sections`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Section[]>()
    return response.map(fromJson)
  },

  // Get unsectioned notes in a notebook
  getUnsectioned: async (notebookId: string): Promise<Note[]> => {
    const response = await client
      .get(`notebooks/${notebookId}/unsectioned`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Note[]>()
    return response.map((note) => ({
      ...note,
      createdAt: dayjs(note.createdAt),
      updatedAt: dayjs(note.updatedAt),
      publishedAt: note.publishedAt ? dayjs(note.publishedAt) : undefined,
      tags: note.tags || [],
    }))
  },

  // Get a single section
  get: async (id: string): Promise<Section> => {
    const response = await client
      .get(`sections/${id}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Section>()
    return fromJson(response)
  },

  // Create or update a section
  create: async (section: Partial<Section>): Promise<Section> => {
    const response = await client
      .post("sections", {
        json: section,
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Section>()
    return fromJson(response)
  },

  // Update section name
  updateName: async (id: string, name: string): Promise<void> => {
    await client.patch(`sections/${id}`, {
      json: { name },
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  // Update section position
  updatePosition: async (id: string, position: number): Promise<void> => {
    await client.put(`sections/${id}/position`, {
      json: { position },
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  // Update note position within its section
  updateNotePosition: async (
    noteId: string,
    notebookId: string,
    position: number
  ): Promise<void> => {
    await client.put(`notes/${noteId}/notebooks/${notebookId}/position`, {
      json: { position },
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  // Delete a section (notes become unsectioned)
  delete: async (id: string): Promise<void> => {
    await client.delete(`sections/${id}`, {
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  // Get all notes in a section
  getNotes: async (sectionId: string): Promise<Note[]> => {
    const response = await client
      .get(`sections/${sectionId}/notes`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Note[]>()
    return response.map((note) => ({
      ...note,
      createdAt: dayjs(note.createdAt),
      updatedAt: dayjs(note.updatedAt),
      publishedAt: note.publishedAt ? dayjs(note.publishedAt) : undefined,
      tags: note.tags || [],
    }))
  },

  // Assign a note to a section within a notebook
  assignNote: async (
    noteId: string,
    notebookId: string,
    sectionId: string | null
  ): Promise<void> => {
    await client.put(`notes/${noteId}/notebooks/${notebookId}/section`, {
      json: { section_id: sectionId },
      headers: commonHeaders(),
      credentials: "include",
    })
  },
}
