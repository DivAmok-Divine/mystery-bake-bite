import { useState, useEffect } from 'react'

/**
 * Custom hook to debounce any value (e.g. search input fields)
 * to avoid expensive re-computations or API calls on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 200): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
