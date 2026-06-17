import { useEffect, useRef } from 'react'

export function usePeriodicTimer(
  callback: () => void,
  intervalMs: number,
  enabled: boolean = true
): void {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return

    let timeoutId: ReturnType<typeof setTimeout>

    const schedule = (): void => {
      timeoutId = setTimeout(() => {
        savedCallback.current()
        schedule()
      }, intervalMs)
    }

    schedule()

    return () => clearTimeout(timeoutId)
  }, [intervalMs, enabled])
}
