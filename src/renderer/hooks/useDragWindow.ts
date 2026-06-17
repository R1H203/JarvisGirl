import { useCallback, useRef } from 'react'
import { useInteractionStore } from '../stores/interactionStore'
import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import type { IPlatformAdapter } from '../platform/PlatformAdapter'

/**
 * Hook for window drag functionality.
 * The platform adapter is passed in during initialization to avoid
 * calling usePlatform() inside event callbacks.
 */
export function useDragWindow(platform: IPlatformAdapter): {
  onPointerDown: (e: React.PointerEvent) => void
} {
  const platformRef = useRef(platform)
  platformRef.current = platform

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    useInteractionStore.getState().setDragging(true)
    useInteractionStore.getState().registerClick(e.clientX, e.clientY)
    eventBus.emit(PetEvent.DRAG_START, { x: e.clientX, y: e.clientY })

    // Initiate window drag via platform adapter
    platformRef.current.window.startDrag().then(() => {
      useInteractionStore.getState().setDragging(false)
      eventBus.emit(PetEvent.DRAG_END, {})
    })
  }, [])

  return { onPointerDown }
}
