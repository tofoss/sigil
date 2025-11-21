// eslint-disable-next-line no-restricted-imports
import dayjs from "dayjs"
import { client } from "./client"
import { Notebook, fromJson } from "./model/notebook"
import { Note } from "./model/note"
import { commonHeaders } from "./utils"

export const notebooks = {
  list: async (): Promise<Notebook[]> => {
    const response = await client
      .get("notebooks", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Notebook[]>()
    return response.map(fromJson)
  },

  get: async (id: string): Promise<Notebook> => {
    const response = await client
      .get(`notebooks/${id}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Notebook>()
    return fromJson(response)
  },

  create: async (notebook: Partial<Notebook>): Promise<Notebook> => {
    const response = await client
      .post("notebooks", {
        json: notebook,
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Notebook>()
    return fromJson(response)
  },

  update: async (
    id: string,
    notebook: Partial<Notebook>
  ): Promise<Notebook> => {
    const response = await client
      .post("notebooks", {
        json: { ...notebook, id },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Notebook>()
    return fromJson(response)
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`notebooks/${id}`, {
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  getNotes: async (id: string): Promise<Note[]> => {
    const response = await client
      .get(`notebooks/${id}/notes`, {
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

  addNote: async (notebookId: string, noteId: string): Promise<void> => {
    await client.put(`notebooks/${notebookId}/notes/${noteId}`, {
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  removeNote: async (notebookId: string, noteId: string): Promise<void> => {
    await client.delete(`notebooks/${notebookId}/notes/${noteId}`, {
      headers: commonHeaders(),
      credentials: "include",
    })
  },

  getNotebooksForNote: async (noteId: string): Promise<Notebook[]> => {
    const response = await client
      .get(`notes/${noteId}/notebooks`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Notebook[]>()
    return response.map(fromJson)
  },
}
