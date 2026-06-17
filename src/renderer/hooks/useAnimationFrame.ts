import { useEffect, useRef } from 'react'

export function useAnimationFrame(
  callback: (deltaTime: number, elapsed: number) => void,
  fpsCap: number = 60,
  enabled: boolean = true
): void {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled) return

    let rafId: number
    let lastTime = performance.now()
    let frameCount = 0
    let fpsTimer = performance.now()
    const frameInterval = 1000 / fpsCap

    const loop = (now: number) => {
      const deltaTime = now - lastTime
      lastTime = now

      if (deltaTime >= frameInterval) {
        const elapsed = now - fpsTimer
        frameCount++
        callbackRef.current(deltaTime, elapsed)

        if (elapsed >= 1000) {
          fpsTimer = now
          frameCount = 0
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [fpsCap, enabled])
}
