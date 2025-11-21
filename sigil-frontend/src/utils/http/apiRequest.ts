import { useState, useCallback } from "react"

type AsyncFunction<T> = () => Promise<T>

export function apiRequest<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const call = useCallback(async (apiFunction: AsyncFunction<T>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiFunction()
      setData(result)
      return result
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, call }
}
