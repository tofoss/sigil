import { client } from "./client"
import { Note, fromJson } from "./model/note"
import { Tag } from "./model/tag"
import { commonHeaders } from "./utils"

export const tagClient = {
  upsert: (name: string) =>
    client
      .post("tags", {
        json: {
          name,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Tag>(),

  fetchAll: () =>
    client
      .get("tags", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Tag[]>(),

  fetch: (id: string) =>
    client
      .get(`tags/${id}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Tag>(),
}
