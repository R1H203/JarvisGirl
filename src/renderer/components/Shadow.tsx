import React from 'react'
import { useConfigStore } from '../stores/configStore'
import { SHADOW_OPACITY, SHADOW_BLUR, SHADOW_OFFSET_Y } from '../utils/constants'

interface ShadowProps {
  characterWidth: number
  characterBottom: number
  hoverIntensity?: number
}

export const Shadow: React.FC<ShadowProps> = React.memo(
  ({ characterWidth, characterBottom, hoverIntensity = 0 }) => {
    const config = useConfigStore((s) => s.config)

    const opacity = config?.shadow?.opacity ?? SHADOW_OPACITY
    const blur = config?.shadow?.blur ?? SHADOW_BLUR
    const offsetY = config?.shadow?.offsetY ?? SHADOW_OFFSET_Y
    const shadowColor = config?.shadow?.color ?? 'hsl(0, 0%, 20%)'

    const adjustedOpacity = Math.min(0.3, opacity + hoverIntensity * 0.08)
    const shadowWidth = characterWidth * 0.9
    const shadowHeight = characterWidth * 0.15

    return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: characterBottom - offsetY,
          width: shadowWidth,
          height: shadowHeight,
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse, ${shadowColor.replace(
            ')',
            `, ${adjustedOpacity})`
          )} 0%, transparent 70%)`,
          filter: `blur(${blur * 0.03 * characterWidth}px)`,
          transition: 'all 0.1s ease-out',
          pointerEvents: 'none'
        }}
      />
    )
  }
)

Shadow.displayName = 'Shadow'
