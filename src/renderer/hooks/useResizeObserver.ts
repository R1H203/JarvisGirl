import { useEffect, useState, useRef } from 'react'

interface Size {
  width: number
  height: number
  dpr: number
}

export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>
): Size {
  const [size, setSize] = useState<Size>({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1
  })
  const rafId = useRef<number>(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          setSize({
            width: Math.round(width),
            height: Math.round(height),
            dpr: window.devicePixelRatio || 1
          })
        }
      })
    })

    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId.current)
    }
  }, [ref])

  return size
}
