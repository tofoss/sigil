import { client } from "./client"
import { Article, fromJson } from "./model/article"
import { commonHeaders } from "./utils"

export const articleClient = {
  upsert: function (content: string, id?: string) {
    return client
      .post("articles", {
        json: {
          articleId: id,
          articleContent: content,
          articlePublished: false,
        },
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Article>()
      .then(fromJson)
  },
  fetchForUser: function () {
    return client
      .get("articles", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<Article[]>()
      .then((a) => a.map(fromJson))
  },
}
