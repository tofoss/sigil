import ky from "ky"

const apiUrl = import.meta.env.VITE_API_URL

export const client = ky.create({
  prefixUrl: apiUrl,
})
