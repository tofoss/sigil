import { client } from "./client"
import { Note, fromJson } from "./model/note"
import { Tag } from "./model/tag"
import { commonHeaders } from "./utils"

export const noteClient = {
  upsert: (content: string, id?: string) =>
    client
      .post("notes", {
        json: {
          id: id,
          content: content,
          published: false,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Note>()
      .then(fromJson),

  fetchForUser: () =>
    client
      .get("notes", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Note[]>()
      .then((a) => a.map(fromJson)),

  fetch: (id: string) =>
    client
      .get(`notes/${id}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Note>()
      .then((a) => fromJson(a)),

  // Tag-related methods
  getNoteTags: (noteId: string) =>
    client
      .get(`notes/${noteId}/tags`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Tag[]>(),

  assignTagsToNote: (noteId: string, tagIds: string[]) =>
    client
      .put(`notes/${noteId}/tags`, {
        json: {
          tagIds: tagIds,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Tag[]>(),

  removeTagFromNote: (noteId: string, tagId: string) =>
    client.delete(`notes/${noteId}/tags/${tagId}`, {
      headers: commonHeaders(),
      credentials: "include",
    }),

  search: (query: string, limit: number = 50, offset: number = 0) =>
    client
      .get("notes/search", {
        searchParams: {
          q: query,
          limit: limit.toString(),
          offset: offset.toString(),
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Note[]>()
      .then((a) => a.map(fromJson)),
}
