import { useEffect, useRef } from 'react'
import { useInteractionStore } from '../stores/interactionStore'

export function useMousePosition(
  containerRef: React.RefObject<HTMLElement | null>,
  enabled: boolean = true
): void {
  const storeRef = useRef(useInteractionStore)
  storeRef.current = useInteractionStore

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current

    const handleMouseMove = (e: MouseEvent) => {
      storeRef.current.getState().setMousePosition(
        e.clientX,
        e.clientY,
        e.screenX,
        e.screenY
      )
    }

    const handleMouseLeave = () => {
      storeRef.current.getState().setHovering(false)
    }

    container.addEventListener('pointermove', handleMouseMove)
    container.addEventListener('pointerleave', handleMouseLeave)

    return () => {
      container.removeEventListener('pointermove', handleMouseMove)
      container.removeEventListener('pointerleave', handleMouseLeave)
    }
  }, [containerRef, enabled])
}
