import ky, { HTTPError } from "ky"

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
    beforeRetry: [
      async ({ request, error, retryCount }) => {
        // Only attempt refresh on first retry and for 401 errors
        if (retryCount !== 1) return

        if (error instanceof HTTPError && error.response.status === 401) {
          // Don't retry refresh or login endpoints
          const url = request.url
          if (url.includes("/users/refresh") || url.includes("/users/login")) {
            return
          }

          try {
            // Refresh the token
            await refreshToken()
          } catch (refreshError) {
            // If refresh fails, redirect to login
            console.error("Token refresh failed:", refreshError)
            // Don't redirect here - let the application handle it
            throw refreshError
          }
        }
      },
    ],
  },
  retry: {
    limit: 1,
    statusCodes: [401],
  },
})
