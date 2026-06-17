import React, { useCallback, useRef } from 'react'
import { useInteractionStore } from '../stores/interactionStore'
import { usePetStore } from '../stores/petStore'
import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import { PetState } from '../types/pet'
import { useDragWindow } from '../hooks/useDragWindow'
import { usePlatform } from '../platform/PlatformProvider'
import { HOVER_DELAY_MS } from '../utils/constants'

export const InteractionGate: React.FC = React.memo(() => {
  const platform = usePlatform()
  const { onPointerDown } = useDragWindow(platform)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHoveringRef = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()

      if (e.button === 2) {
        // Right click
        eventBus.emit(PetEvent.RIGHT_CLICK, { x: e.clientX, y: e.clientY })
        return
      }

      // Left click
      useInteractionStore.getState().registerClick(e.clientX, e.clientY)
      eventBus.emit(PetEvent.CLICK, {
        x: e.clientX,
        y: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY
      })

      // If sleeping, wake up
      if (usePetStore.getState().state === PetState.Sleeping) {
        eventBus.emit(PetEvent.WAKE, {})
      }

      onPointerDown(e)
    },
    [onPointerDown]
  )

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent) => {
      // Debounce hover to avoid flicker
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(() => {
        isHoveringRef.current = true
        useInteractionStore.getState().setHovering(true)
        eventBus.emit(PetEvent.HOVER_START, { x: e.clientX, y: e.clientY })
      }, HOVER_DELAY_MS)
    },
    []
  )

  const handlePointerLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    isHoveringRef.current = false
    useInteractionStore.getState().setHovering(false)
    eventBus.emit(PetEvent.HOVER_END, {})
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        WebkitAppRegion: 'drag',
        cursor: 'grab',
        touchAction: 'none'
      }}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    />
  )
})

InteractionGate.displayName = 'InteractionGate'
