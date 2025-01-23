import { client } from "./client"
import { commonHeaders } from "./utils"

export const articleClient = {
  upsert: function (content: string, id?: string) {
    return client.post("articles", {
      json: {
        artircleId: id,
        articleContent: content,
        articlePublished: false,
      },
      headers: commonHeaders(),
      credentials: "include",
    })
  },
}
