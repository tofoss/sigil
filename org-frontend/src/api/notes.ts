import { client } from "./client"
import { Note, fromJson } from "./model/note"
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
}
