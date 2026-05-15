import { useEffect, useRef } from 'react'

export const useClickOutside = (handler: () => void) => {
  const domNode = useRef<any>(null)

  useEffect(() => {
    const maybeHandler = (event: MouseEvent | TouchEvent) => {
      if (domNode.current && !domNode.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', maybeHandler)
    document.addEventListener('touchstart', maybeHandler)

    return () => {
      document.removeEventListener('mousedown', maybeHandler)
      document.removeEventListener('touchstart', maybeHandler)
    }
  }, [handler])

  return domNode
}
