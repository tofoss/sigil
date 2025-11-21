import { useState, useEffect } from "react"

type AsyncFunction<T> = () => Promise<T>

export const useFetch = <T>(
  apiFunction: AsyncFunction<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await apiFunction()
        setData(result)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, dependencies)

  return { data, loading, error }
}
