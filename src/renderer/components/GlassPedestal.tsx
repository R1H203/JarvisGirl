import React from 'react'
import { useConfigStore } from '../stores/configStore'
import { GLASS_OPACITY, GLASS_BLUR, GLASS_HEIGHT, GLASS_WIDTH_RATIO } from '../utils/constants'

interface GlassPedestalProps {
  characterWidth: number
  characterBottom: number
  hoverIntensity?: number
}

export const GlassPedestal: React.FC<GlassPedestalProps> = React.memo(
  ({ characterWidth, characterBottom, hoverIntensity = 0 }) => {
    const config = useConfigStore((s) => s.config)

    const opacity = config?.glass?.opacity ?? GLASS_OPACITY
    const blur = config?.glass?.blur ?? GLASS_BLUR
    const height = config?.glass?.height ?? GLASS_HEIGHT
    const widthRatio = config?.glass?.widthRatio ?? GLASS_WIDTH_RATIO

    const glassWidth = characterWidth * widthRatio
    const adjustedOpacity = opacity + hoverIntensity * 0.08

    return (
      <>
        {/* Glass shadow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: characterBottom - 4,
            width: glassWidth * 0.9,
            height: height * 0.6,
            transform: 'translateX(-50%)',
            borderRadius: height,
            background: `hsla(0, 0%, 0%, ${0.1 + hoverIntensity * 0.05})`,
            filter: `blur(${blur * 0.5}px)`,
            transition: 'all 0.1s ease-out',
            pointerEvents: 'none'
          }}
        />

        {/* Glass base */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: characterBottom,
            width: glassWidth,
            height,
            transform: 'translateX(-50%)',
            borderRadius: height,
            background: `hsla(210, 30%, 80%, ${adjustedOpacity})`,
            backdropFilter: `blur(${blur}px)`,
            WebkitBackdropFilter: `blur(${blur}px)`,
            border: `1px solid hsla(210, 40%, 90%, ${adjustedOpacity * 0.4})`,
            boxShadow: `
              0 0 ${height * 0.5}px hsla(210, 30%, 80%, ${adjustedOpacity * 0.3}),
              0 ${height * 0.3}px ${height * 0.6}px hsla(0, 0%, 0%, ${0.08 + hoverIntensity * 0.04}),
              inset 0 1px 1px hsla(0, 0%, 100%, ${adjustedOpacity * 0.5})
            `,
            transition: 'all 0.1s ease-out',
            pointerEvents: 'none'
          }}
        />

        {/* Glass highlight */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: characterBottom + 1,
            width: glassWidth * 0.6,
            height: height * 0.4,
            transform: 'translateX(-50%)',
            borderRadius: height * 0.4,
            background: `linear-gradient(180deg, hsla(0, 0%, 100%, ${0.2 + hoverIntensity * 0.1}) 0%, transparent 100%)`,
            transition: 'all 0.1s ease-out',
            pointerEvents: 'none'
          }}
        />
      </>
    )
  }
)

GlassPedestal.displayName = 'GlassPedestal'
