import React, { useRef, useEffect } from 'react'
import { AmbientLight } from './AmbientLight'
import { Shadow } from './Shadow'
import { CharacterRenderer } from './CharacterRenderer'
import { GlassPedestal } from './GlassPedestal'
import { ParticleCanvas } from './ParticleCanvas'
import { InteractionGate } from './InteractionGate'
import { useResizeObserver } from '../hooks/useResizeObserver'
import { useMousePosition } from '../hooks/useMousePosition'
import { useConfigStore } from '../stores/configStore'
import { useInteractionStore } from '../stores/interactionStore'

export const PetCanvas: React.FC = React.memo(() => {
  const containerRef = useRef<HTMLDivElement>(null)
  const size = useResizeObserver(containerRef)
  const config = useConfigStore((s) => s.config)
  const isHovering = useInteractionStore((s) => s.isHovering)

  useMousePosition(containerRef, true)

  const characterSize = config?.character?.size ?? 0.6
  const charWidth = size.width * characterSize
  const charHeight = charWidth * 1.5
  const characterBottom = size.height * 0.1

  const hoverIntensity = isHovering ? 1 : 0

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent'
      }}
    >
      <AmbientLight
        characterWidth={charWidth}
        characterBottom={characterBottom}
      />

      <Shadow
        characterWidth={charWidth}
        characterBottom={characterBottom}
        hoverIntensity={hoverIntensity}
      />

      <CharacterRenderer
        containerWidth={size.width}
        containerHeight={size.height}
      />

      <GlassPedestal
        characterWidth={charWidth}
        characterBottom={characterBottom}
        hoverIntensity={hoverIntensity}
      />

      <ParticleCanvas />

      <InteractionGate />
    </div>
  )
})

PetCanvas.displayName = 'PetCanvas'
