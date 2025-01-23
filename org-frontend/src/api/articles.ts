import { client } from "./client"
import { Article } from "./model/article"
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
  },
}
