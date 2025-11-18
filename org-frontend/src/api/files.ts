import { client } from "./client"
import { commonHeaders } from "./utils"

export const fileClient = {
  upload: async (file: File, noteId?: string) => {
    const form = new FormData()
    form.append("file", file)
    if (noteId) form.append("noteId", noteId)

    const response = await client.post("files/", {
      body: form,
      headers: commonHeaders(),
      credentials: "include",
    })
    return response.text()
  },
}
