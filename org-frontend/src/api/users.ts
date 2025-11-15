import { client } from "./client"
import { AuthStatus } from "./model"
import { commonHeaders } from "./utils"

export const userClient = {
  login: function (username: string, password: string) {
    return client.post("users/login", {
      json: { username: username, password: password },
      credentials: "include",
    })
  },

  status: function () {
    return client
      .get("users/status", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<AuthStatus>()
  },

  logout: function () {
    return client.post("users/logout", {
      headers: commonHeaders(),
      credentials: "include",
    })
  },
}
