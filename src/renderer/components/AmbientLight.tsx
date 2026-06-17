import React from 'react'
import { useConfigStore } from '../stores/configStore'
import { AMBIENT_BRIGHTNESS, AMBIENT_BLUR } from '../utils/constants'

interface AmbientLightProps {
  characterWidth: number
  characterBottom: number
}

export const AmbientLight: React.FC<AmbientLightProps> = React.memo(
  ({ characterWidth, characterBottom }) => {
    const config = useConfigStore((s) => s.config)

    const brightness = config?.ambientLight?.brightness ?? AMBIENT_BRIGHTNESS
    const hue = config?.ambientLight?.hue ?? 210
    const saturation = config?.ambientLight?.saturation ?? 30
    const blur = config?.ambientLight?.blur ?? AMBIENT_BLUR

    const lightSize = characterWidth * 2.5

    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: characterBottom - lightSize * 0.2,
          width: lightSize,
          height: lightSize * 0.6,
          transform: 'translateX(-50%)',
          background: `radial-gradient(
            ellipse 60% 50% at 50% 60%,
            hsla(${hue}, ${saturation}%, 70%, ${brightness}) 0%,
            transparent 100%
          )`,
          filter: `blur(${blur}px)`,
          pointerEvents: 'none'
        }}
      />
    )
  }
)

AmbientLight.displayName = 'AmbientLight'
