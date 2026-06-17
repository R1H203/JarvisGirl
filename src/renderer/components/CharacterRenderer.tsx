import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePetStore } from '../stores/petStore'
import { useAnimationStore } from '../stores/animationStore'
import { useConfigStore } from '../stores/configStore'
import { useDebugStore } from '../stores/debugStore'
import { Expression } from '../types/pet'
import { logger } from '../utils/logger'

interface CharacterRendererProps {
  containerWidth: number
  containerHeight: number
}

// ── Debug info shared with DebugOverlay ──
export interface CharacterDebugInfo {
  name: string
  currentSrc: string
  loaded: boolean
  naturalWidth: number
  naturalHeight: number
  error: string | null
}

// Global mutable debug state (not reactive — read by DebugOverlay via ref)
let _debugInfo: CharacterDebugInfo = {
  name: '-',
  currentSrc: '-',
  loaded: false,
  naturalWidth: 0,
  naturalHeight: 0,
  error: null
}

export function getCharacterDebugInfo(): CharacterDebugInfo {
  return _debugInfo
}

// ── Fallback placeholder ──
function generatePlaceholderSVG(expression: Expression, width: number): string {
  const colors: Record<string, string> = {
    normal: '#6B8EC4',
    happy: '#8FC48B',
    sad: '#8B8BC4',
    sleep: '#A0A0B0',
    think: '#C4B06B',
    surprise: '#C48BC4',
    blink: '#6B8EC4'
  }
  const color = colors[expression] || '#6B8EC4'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width * 1.5}" viewBox="0 0 200 300">
    <ellipse cx="100" cy="140" rx="70" ry="90" fill="${color}" opacity="0.6"/>
    <circle cx="75" cy="120" r="8" fill="#2a2040" opacity="0.8"/>
    <circle cx="125" cy="120" r="8" fill="#2a2040" opacity="0.8"/>
    <ellipse cx="100" cy="160" rx="15" ry="4" fill="#5a4050" opacity="0.6"/>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export const CharacterRenderer: React.FC<CharacterRendererProps> = React.memo(
  ({ containerWidth, containerHeight }) => {
    const state = usePetStore((s) => s.state)
    const expression = usePetStore((s) => s.expression)
    const breathScale = useAnimationStore((s) => s.breathScale)
    const breathVertical = useAnimationStore((s) => s.breathVertical)
    const hoverScale = useAnimationStore((s) => s.hoverScale)
    const clickScale = useAnimationStore((s) => s.clickScale)
    const isBlinking = useAnimationStore((s) => s.isBlinking)
    const blinkProgress = useAnimationStore((s) => s.blinkProgress)
    const eyeTargetX = useAnimationStore((s) => s.eyeTargetX)
    const eyeTargetY = useAnimationStore((s) => s.eyeTargetY)
    const headTiltX = useAnimationStore((s) => s.headTiltX)
    const earWigglePhase = useAnimationStore((s) => s.earWigglePhase)
    const tailWagPhase = useAnimationStore((s) => s.tailWagPhase)
    const tailWagAmplitude = useAnimationStore((s) => s.tailWagAmplitude)
    const config = useConfigStore((s) => s.config)

    const [loadError, setLoadError] = useState(false)
    const [imgLoaded, setImgLoaded] = useState(false)
    const imgRef = useRef<HTMLImageElement | null>(null)

    const characterSize = config?.character?.size ?? 0.6
    const charWidth = containerWidth * characterSize
    const charHeight = charWidth * 1.5
    const characterBottom = containerHeight * 0.1
    const characterLeft = (containerWidth - charWidth) / 2
    const scale = breathScale * hoverScale * clickScale

    const characterDir = config?.character?.directory ?? 'default'
    const imgSrc = `assets/characters/${characterDir}/${expression}.png`

    // Reset error state when expression changes
    useEffect(() => {
      setLoadError(false)
      setImgLoaded(false)
    }, [expression, characterDir])

    // Debug info update
    useEffect(() => {
      _debugInfo = {
        name: characterDir,
        currentSrc: imgSrc,
        loaded: imgLoaded,
        naturalWidth: imgRef.current?.naturalWidth ?? 0,
        naturalHeight: imgRef.current?.naturalHeight ?? 0,
        error: loadError ? `Failed to load: ${imgSrc}` : null
      }
      logger.debug(`CharacterRenderer: ${imgSrc} loaded=${imgLoaded} error=${loadError}`)
    }, [imgSrc, imgLoaded, loadError, characterDir])

    const handleLoad = useCallback(() => {
      setImgLoaded(true)
      setLoadError(false)
      const img = imgRef.current
      if (img) {
        logger.info(`Character: ${imgSrc} loaded (${img.naturalWidth}x${img.naturalHeight})`)
      }
    }, [imgSrc])

    const handleError = useCallback(() => {
      setLoadError(true)
      setImgLoaded(false)
      logger.error(`Character: failed to load ${imgSrc} — check that file exists in public/${imgSrc}`)
    }, [imgSrc])

    const fallbackSrc = generatePlaceholderSVG(expression, Math.round(charWidth))

    return (
      <motion.div
        style={{
          position: 'absolute',
          left: characterLeft,
          bottom: characterBottom,
          width: charWidth,
          height: charHeight,
          transformOrigin: 'bottom center',
          scale,
          y: -breathVertical,
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        }}
      >
        {/* Primary character image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={expression + (loadError ? '-fallback' : '')}
            ref={imgRef}
            src={loadError ? fallbackSrc : imgSrc}
            alt={expression}
            initial={{ opacity: 0 }}
            animate={{ opacity: imgLoaded || loadError ? 1 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom center'
            }}
            draggable={false}
          />
        </AnimatePresence>

        {/* Blink overlay */}
        {isBlinking && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `${charHeight * 0.35}px`,
                left: `${charWidth * 0.2}px`,
                width: `${charWidth * 0.6}px`,
                height: `${charHeight * 0.15}px`,
                background: 'transparent',
                borderBottom: `${charHeight * 0.08 * blinkProgress}px solid #222`,
                borderRadius: '50%',
                transformOrigin: 'center'
              }}
            />
          </div>
        )}

        {/* Eye follow */}
        <div
          style={{
            position: 'absolute',
            top: `${charHeight * 0.38}px`,
            left: `${charWidth * 0.2}px`,
            width: `${charWidth * 0.6}px`,
            height: `${charHeight * 0.08}px`,
            transform: `translate(${eyeTargetX}px, ${eyeTargetY}px)`,
            pointerEvents: 'none'
          }}
        />

        {/* Head tilt */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `rotate(${headTiltX * 0.5}deg)`,
            pointerEvents: 'none'
          }}
        />

        {/* Tail wag */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: '-10%',
            width: '20%',
            height: '20%',
            transformOrigin: 'bottom left',
            transform: `rotate(${Math.sin(tailWagPhase) * tailWagAmplitude}deg)`,
            pointerEvents: 'none'
          }}
        />
      </motion.div>
    )
  }
)

CharacterRenderer.displayName = 'CharacterRenderer'
