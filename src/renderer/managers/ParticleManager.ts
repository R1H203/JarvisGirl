import { randomRange, randomInt } from '../utils/math'

export type ParticleType = 'star' | 'bubble' | 'light' | 'heart'

interface Particle {
  type: ParticleType
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  active: boolean
  hue: number
}

export class ParticleManager {
  private particles: Particle[] = []
  private maxCount = 8
  private hue = 210

  setMaxCount(count: number): void {
    this.maxCount = count
  }

  setThemeHue(hue: number): void {
    this.hue = hue
  }

  spawn(
    type: ParticleType,
    x: number,
    y: number,
    count: number = 3
  ): void {
    const activeCount = this.particles.filter((p) => p.active).length
    const spawnCount = Math.min(count, this.maxCount - activeCount)

    for (let i = 0; i < spawnCount; i++) {
      const particle = this.getInactiveParticle()
      if (!particle) break

      particle.type = type
      particle.x = x + randomRange(-20, 20)
      particle.y = y + randomRange(-10, 10)
      particle.vx = randomRange(-1.5, 1.5)
      particle.vy = randomRange(-3, -1)
      particle.life = 0
      particle.maxLife = randomRange(1000, 1800)
      particle.size = randomRange(4, 12)
      particle.rotation = randomRange(0, Math.PI * 2)
      particle.rotationSpeed = randomRange(-0.05, 0.05)
      particle.opacity = 1
      particle.active = true
      particle.hue = this.hue + randomInt(-20, 20)
    }
  }

  update(deltaTime: number): void {
    for (const p of this.particles) {
      if (!p.active) continue

      p.life += deltaTime
      p.x += p.vx * (deltaTime / 16)
      p.y += p.vy * (deltaTime / 16)
      p.vy += 0.05 * (deltaTime / 16) // Gravity
      p.rotation += p.rotationSpeed * (deltaTime / 16)

      // Fade in then out
      const lifeRatio = p.life / p.maxLife
      if (lifeRatio < 0.1) {
        p.opacity = lifeRatio / 0.1
      } else {
        p.opacity = 1 - (lifeRatio - 0.1) / 0.9
      }

      if (p.opacity <= 0 || p.life >= p.maxLife) {
        p.active = false
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (!p.active) continue

      ctx.save()
      ctx.globalAlpha = Math.max(0, p.opacity)

      switch (p.type) {
        case 'star':
          this.renderStar(ctx, p)
          break
        case 'bubble':
          this.renderBubble(ctx, p)
          break
        case 'light':
          this.renderLight(ctx, p)
          break
        case 'heart':
          this.renderHeart(ctx, p)
          break
      }

      ctx.restore()
    }
  }

  clear(): void {
    this.particles.forEach((p) => (p.active = false))
  }

  private getInactiveParticle(): Particle | undefined {
    const existing = this.particles.find((p) => !p.active)
    if (existing) return existing

    if (this.particles.length < this.maxCount) {
      const p: Particle = {
        type: 'star',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        size: 0,
        rotation: 0,
        rotationSpeed: 0,
        opacity: 0,
        active: false,
        hue: this.hue
      }
      this.particles.push(p)
      return p
    }

    return undefined
  }

  private renderStar(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)

    ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.opacity})`
    ctx.beginPath()
    const spikes = 5
    const outerR = p.size / 2
    const innerR = outerR * 0.4
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = (i * Math.PI) / spikes - Math.PI / 2
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
  }

  private renderBubble(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 60%, 75%, ${p.opacity * 0.4})`
    ctx.fill()
    ctx.strokeStyle = `hsla(${p.hue}, 70%, 85%, ${p.opacity * 0.6})`
    ctx.lineWidth = 1
    ctx.stroke()

    // Highlight
    ctx.beginPath()
    ctx.arc(p.x - p.size * 0.15, p.y - p.size * 0.15, p.size * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(0, 0%, 100%, ${p.opacity * 0.5})`
    ctx.fill()
  }

  private renderLight(ctx: CanvasRenderingContext2D, p: Particle): void {
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size / 2)
    gradient.addColorStop(0, `hsla(${p.hue}, 80%, 85%, ${p.opacity * 0.8})`)
    gradient.addColorStop(1, `hsla(${p.hue}, 80%, 85%, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderHeart(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    const s = p.size / 20

    ctx.fillStyle = `hsla(340, 80%, 65%, ${p.opacity})`
    ctx.beginPath()
    ctx.moveTo(0, 4 * s)
    ctx.bezierCurveTo(-8 * s, -2 * s, -12 * s, 4 * s, 0, 12 * s)
    ctx.bezierCurveTo(12 * s, 4 * s, 8 * s, -2 * s, 0, 4 * s)
    ctx.closePath()
    ctx.fill()
  }
}
