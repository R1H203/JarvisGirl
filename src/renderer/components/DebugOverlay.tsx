import React, { useRef, useState, useEffect } from 'react'
import { useDebugStore } from '../stores/debugStore'
import { usePetStore } from '../stores/petStore'
import { useAnimationStore } from '../stores/animationStore'
import { getCharacterDebugInfo, type CharacterDebugInfo } from './CharacterRenderer'

export const DebugOverlay: React.FC = React.memo(() => {
  const visible = useDebugStore((s) => s.visible)
  const showHitbox = useDebugStore((s) => s.showHitbox)
  const fps = useDebugStore((s) => s.fps)
  const frameTime = useDebugStore((s) => s.frameTime)
  const lastTransition = useDebugStore((s) => s.lastStateTransition)
  const state = usePetStore((s) => s.state)
  const expression = usePetStore((s) => s.expression)
  const breathScale = useAnimationStore((s) => s.breathScale)
  const breathVertical = useAnimationStore((s) => s.breathVertical)
  const isBlinking = useAnimationStore((s) => s.isBlinking)
  const hoverScale = useAnimationStore((s) => s.hoverScale)
  const clickScale = useAnimationStore((s) => s.clickScale)

  // Poll character debug info each frame (it's a non-reactive global)
  const [charInfo, setCharInfo] = useState<CharacterDebugInfo>({
    name: '-', currentSrc: '-', loaded: false,
    naturalWidth: 0, naturalHeight: 0, error: null
  })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!visible) return
    const poll = (): void => {
      setCharInfo({ ...getCharacterDebugInfo() })
      rafRef.current = requestAnimationFrame(poll)
    }
    rafRef.current = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafRef.current)
  }, [visible])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        padding: '8px 12px',
        background: 'rgba(0,0,0,0.75)',
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '11px',
        lineHeight: '1.6',
        zIndex: 9999,
        pointerEvents: 'none',
        borderBottomRightRadius: '8px',
        backdropFilter: 'blur(8px)',
        minWidth: 220,
        maxWidth: 320
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#fff' }}>
        🐱 JarvisGirl Debug
      </div>

      {/* Performance */}
      <Section title="PERF">
        <Line label="FPS" value={`${fps}`} color={fps >= 50 ? '#0f0' : fps >= 20 ? '#ff0' : '#f00'} />
        <Line label="Frame" value={`${frameTime.toFixed(1)}ms`} color="#888" />
      </Section>

      {/* State machine */}
      <Section title="STATE">
        <Line label="PetState" value={state} color="#0ff" />
        <Line label="Expression" value={expression} color="#f0f" />
        {lastTransition && <Line label="Last" value={lastTransition} color="#ff0" />}
      </Section>

      {/* Character / Texture */}
      <Section title="CHARACTER">
        <Line label="Name" value={charInfo.name} />
        <Line label="PNG" value={charInfo.currentSrc} color="#8cf" />
        <Line label="Loaded" value={charInfo.loaded ? '✅' : '❌'} color={charInfo.loaded ? '#0f0' : '#f00'} />
        {charInfo.naturalWidth > 0 && (
          <Line label="Size" value={`${charInfo.naturalWidth} × ${charInfo.naturalHeight}`} />
        )}
        {charInfo.error && <Line label="Error" value={charInfo.error} color="#f00" />}
      </Section>

      {/* Animation params */}
      <Section title="ANIMATION">
        <Line label="Breath" value={`${breathScale.toFixed(4)} | ${breathVertical.toFixed(1)}px`} />
        <Line label="Blink" value={isBlinking ? '👁️ closing' : '◡ open'} />
        <Line label="Hover" value={`×${hoverScale.toFixed(3)}`} />
        <Line label="Click" value={`×${clickScale.toFixed(3)}`} />
      </Section>

      {/* Hitbox toggle indicator */}
      {showHitbox && (
        <div style={{ color: '#ff0', marginTop: 4, borderTop: '1px solid #333', paddingTop: 4 }}>
          ⬜ Hitbox: ON
        </div>
      )}

      {/* Shortcut reminder */}
      <div style={{ marginTop: 4, color: '#666', fontSize: '10px', borderTop: '1px solid #333', paddingTop: 4 }}>
        Ctrl+Shift+D: Toggle · F12: DevTools · Ctrl+Shift+H: Hitbox
      </div>
    </div>
  )
})

DebugOverlay.displayName = 'DebugOverlay'

// ── Helpers ──

const Section: React.FC<{ title: string; children: React.ReactNode }> = React.memo(
  ({ title, children }) => (
    <div style={{ marginBottom: 3 }}>
      <div style={{ color: '#666', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {title}
      </div>
      {children}
    </div>
  )
)
Section.displayName = 'Section'

const Line: React.FC<{ label: string; value: string; color?: string }> = React.memo(
  ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: '#aaa' }}>{label}</span>
      <span style={{ color: color ?? '#fff', textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
)
Line.displayName = 'Line'
