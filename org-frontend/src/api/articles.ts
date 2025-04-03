import { client } from "./client"
import { Article, fromJson } from "./model/article"
import { commonHeaders } from "./utils"

export const articleClient = {
  upsert: (content: string, id?: string) =>
    client
      .post("articles", {
        json: {
          id: id,
          content: content,
          published: false,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Article>()
      .then(fromJson),

  fetchForUser: () =>
    client
      .get("articles", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Article[]>()
      .then((a) => a.map(fromJson)),

  fetch: (id: string) =>
    client
      .get(`articles/${id}`, {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Article>()
      .then((a) => fromJson(a)),
}
