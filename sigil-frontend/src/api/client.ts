import ky, { HTTPError } from "ky"
import { getCookie } from "./utils"

const apiUrl = import.meta.env.VITE_API_URL

let isRefreshing = false
let refreshPromise: Promise<void> | null = null

// Helper to refresh token
async function refreshToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    try {
      isRefreshing = true
      await ky.post(`${apiUrl}/users/refresh`, {
        credentials: "include",
      })
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export const client = ky.create({
  prefixUrl: apiUrl,
  hooks: {
    afterResponse: [
      async (request, options, response) => {
        // Handle 401 responses by refreshing token and retrying
        if (response.status === 401) {
          const url = request.url

          // Don't refresh for login/refresh endpoints
          if (url.includes("/users/refresh") || url.includes("/users/login")) {
            return response
          }

          try {
            // Refresh the token
            await refreshToken()

            // Get the new XSRF token from cookie
            const newXsrfToken = getCookie("XSRF-TOKEN")

            // Retry the original request with updated credentials
            // Clone the request and update the XSRF header
            const newHeaders = new Headers(request.headers)
            if (newXsrfToken) {
              newHeaders.set("X-XSRF-TOKEN", newXsrfToken)
            }

            // Create a new request with updated headers
            const retryResponse = await ky(request.url, {
              method: request.method,
              headers: newHeaders,
              body: request.body,
              credentials: "include",
            })

            return retryResponse
          } catch (error) {
            return response // Return original 401 response
          }
        }

        return response
      },
    ],
  },
})
