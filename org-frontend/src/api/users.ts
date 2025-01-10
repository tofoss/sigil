import { client } from "./client"
import { AuthStatus } from "./model"
import { commonHeaders } from "./utils"

export const userClient = {
  login: function (username: string, password: string) {
    return client.post("users/auth/login", {
      json: { loginUsername: username, loginPassword: password },
      credentials: "include",
    })
  },

  status: function () {
    return client
      .get("users/auth/status", {
        headers: commonHeaders(),
        credentials: "include",
      })
      .json<AuthStatus>()
  },
}
