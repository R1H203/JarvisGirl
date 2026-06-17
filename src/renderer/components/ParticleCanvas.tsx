import React, { useRef, useEffect, useCallback } from 'react'
import { ParticleManager, ParticleType } from '../managers/ParticleManager'
import { useConfigStore } from '../stores/configStore'
import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import { MAX_PARTICLES, PARTICLE_FPS } from '../utils/constants'

export const ParticleCanvas: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const managerRef = useRef<ParticleManager | null>(null)
  const config = useConfigStore((s) => s.config)
  const particleConfig = config?.particles

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const manager = new ParticleManager()
    managerRef.current = manager

    if (particleConfig) {
      manager.setMaxCount(particleConfig.maxCount ?? MAX_PARTICLES)
    }
    if (config?.ambientLight?.hue) {
      manager.setThemeHue(config.ambientLight.hue)
    }

    // Resize canvas
    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    // Particle spawn triggers
    const onHover = (payload: { x: number; y: number }): void => {
      if (particleConfig?.spawnOnHover) {
        manager.spawn('light', payload.x, payload.y, particleConfig.spawnOnHover)
      }
    }

    const onClick = (payload: {
      x: number
      y: number
    }): void => {
      if (particleConfig?.spawnOnClick) {
        const types: ParticleType[] = ['star', 'bubble', 'light']
        const type = types[Math.floor(Math.random() * types.length)]
        manager.spawn(type, payload.x, payload.y, particleConfig.spawnOnClick)
      }
    }

    const onAIEnd = (): void => {
      if (particleConfig?.spawnOnAiReply) {
        manager.spawn(
          'star',
          window.innerWidth / 2,
          window.innerHeight * 0.6,
          particleConfig.spawnOnAiReply
        )
      }
    }

    const unsubHover = eventBus.on(PetEvent.HOVER_START, onHover)
    const unsubClick = eventBus.on(PetEvent.CLICK, onClick)
    const unsubAI = eventBus.on(PetEvent.AI_END, onAIEnd)

    // Animation loop
    let lastTime = performance.now()
    let animFrameId: number
    const frameInterval = 1000 / (config?.performance?.particleFps ?? PARTICLE_FPS)

    const loop = (now: number): void => {
      const delta = now - lastTime
      if (delta >= frameInterval) {
        lastTime = now
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        manager.update(delta)
        manager.render(ctx)
      }
      animFrameId = requestAnimationFrame(loop)
    }

    animFrameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', resize)
      unsubHover()
      unsubClick()
      unsubAI()
    }
  }, [particleConfig, config?.ambientLight?.hue, config?.performance?.particleFps])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100
      }}
    />
  )
})

ParticleCanvas.displayName = 'ParticleCanvas'
