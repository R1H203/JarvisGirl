/**
 * ParticleSystem — D: 粒子效果系统
 *
 * Canvas 覆盖层，浮动粒子：star / heart / sparkle / bubble
 * - 事件驱动: 订阅 `particle:burst` 事件 → 爆发粒子
 * - 性能: 对象池（最大80），粒子全部死亡后停止 rAF
 * - 不依赖 PixiJS，独立 Canvas 覆盖层（pointer-events:none）
 */

import { eventBus } from './eventBus'

export interface ParticleBurstPayload {
  type: 'star' | 'heart' | 'sparkle' | 'bubble'
  x: number
  y: number
  count: number
  emotion?: string
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
  type: 'star' | 'heart' | 'sparkle' | 'bubble'
  alpha: number
  rotation: number
  rotationSpeed: number
  color: string
  gravity: number
}

// ── 状态 ──
const MAX_PARTICLES = 80
const pool: Particle[] = []
const active: Particle[] = []

let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let rafId: number | null = null
let isRunning = false

// ── 颜色表 ──
const COLORS: Record<string, string[]> = {
  star: ['#FFD700', '#FFA500', '#FFEC8B'],
  heart: ['#FF6B9D', '#FF3388', '#FF69B4'],
  sparkle: ['#FFFFFF', '#E0F0FF', '#B0E0FF'],
  bubble: ['rgba(255,255,255,0.6)', 'rgba(200,230,255,0.5)'],
}

function randColor(type: string): string {
  const colors = COLORS[type] ?? ['#FFFFFF']
  return colors[Math.floor(Math.random() * colors.length)]
}

// ── 对象池 ──
function allocParticle(): Particle {
  return pool.pop() ?? {} as Particle
}

function freeParticle(p: Particle): void {
  if (pool.length < MAX_PARTICLES) pool.push(p)
}

// ── 生成爆发 ──
function spawnBurst(payload: ParticleBurstPayload): void {
  for (let i = 0; i < payload.count; i++) {
    const p = allocParticle()
    const angle = (Math.PI * 2 * i) / payload.count + (Math.random() - 0.5) * 1.0
    const speed = 1.5 + Math.random() * 3.0

    p.x = payload.x
    p.y = payload.y
    p.vx = Math.cos(angle) * speed
    p.vy = Math.sin(angle) * speed - 2  // 略向上
    p.life = 40 + Math.random() * 50
    p.maxLife = p.life
    p.size = 3 + Math.random() * 6
    p.type = payload.type
    p.alpha = 1
    p.rotation = Math.random() * Math.PI * 2
    p.rotationSpeed = (Math.random() - 0.5) * 0.12
    p.color = randColor(payload.type)
    p.gravity = 0.035

    active.push(p)
  }
}

// ── 更新 ──
function update(): void {
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += p.gravity
    p.vy *= 0.97
    p.vx *= 0.97
    p.life -= 1
    p.alpha = Math.max(0, p.life / p.maxLife)
    p.rotation += p.rotationSpeed

    if (p.life <= 0) {
      active.splice(i, 1)
      freeParticle(p)
    }
  }
}

// ── 渲染 ──

function drawStar(c: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number): void {
  c.save(); c.translate(x, y); c.rotate(rot)
  const spikes = 5, outer = size, inner = size * 0.4
  c.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (Math.PI * i) / spikes - Math.PI / 2
    const px = Math.cos(a) * r
    const py = Math.sin(a) * r
    i === 0 ? c.moveTo(px, py) : c.lineTo(px, py)
  }
  c.closePath(); c.fill(); c.restore()
}

function drawHeart(c: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  c.save(); c.translate(x, y)
  c.beginPath()
  c.moveTo(0, size * 0.35)
  c.bezierCurveTo(-size * 0.5, -size * 0.4, -size, size * 0.1, 0, size)
  c.bezierCurveTo(size, size * 0.1, size * 0.5, -size * 0.4, 0, size * 0.35)
  c.closePath(); c.fill(); c.restore()
}

function drawSparkle(c: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  // 外发光
  c.beginPath(); c.arc(x, y, size * 0.6, 0, Math.PI * 2); c.fill()
  // 内亮点
  c.fillStyle = '#FFFFFF'
  c.beginPath(); c.arc(x, y, size * 0.2, 0, Math.PI * 2); c.fill()
}

function drawBubble(c: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  c.strokeStyle = c.fillStyle
  c.lineWidth = 1
  c.beginPath(); c.arc(x, y, size, 0, Math.PI * 2); c.stroke()
  // 高光
  c.fillStyle = 'rgba(255,255,255,0.3)'
  c.beginPath(); c.arc(x - size * 0.3, y - size * 0.3, size * 0.25, 0, Math.PI * 2); c.fill()
}

function render(): void {
  if (!ctx || !canvas) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  for (const p of active) {
    ctx.globalAlpha = p.alpha
    ctx.fillStyle = p.color

    switch (p.type) {
      case 'star': drawStar(ctx, p.x, p.y, p.size, p.rotation); break
      case 'heart': drawHeart(ctx, p.x, p.y, p.size); break
      case 'sparkle': drawSparkle(ctx, p.x, p.y, p.size); break
      case 'bubble': drawBubble(ctx, p.x, p.y, p.size); break
    }
  }

  ctx.globalAlpha = 1
}

// ── 主循环 ──
function loop(): void {
  if (!isRunning) return
  update()
  render()
  if (active.length > 0) {
    rafId = requestAnimationFrame(loop)
  } else {
    rafId = null
    isRunning = false
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}

// ── Canvas 初始化 ──
function ensureCanvas(): void {
  if (canvas) return
  canvas = document.createElement('canvas')
  canvas.style.cssText = [
    'position: fixed',
    'top: 0', 'left: 0',
    'width: 100%', 'height: 100%',
    'pointer-events: none',
    'z-index: 1',
  ].join(';')
  document.body.appendChild(canvas)
  ctx = canvas.getContext('2d')!

  const resize = (): void => {
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)
}

// ── 情绪联动：表情变化自动触发粒子 ──
function autoTriggerOnEmotion(payload: any): void {
  if (!payload?.emotion) return
  const cx = window.innerWidth / 2
  const cy = window.innerHeight * 0.5
  switch (payload.emotion) {
    case 'happy':
      eventBus.emit('particle:burst', { type: 'heart', x: cx, y: cy, count: 4, emotion: 'happy' })
      break
    case 'surprised':
      eventBus.emit('particle:burst', { type: 'sparkle', x: cx, y: cy, count: 5, emotion: 'surprised' })
      break
    case 'curious':
      eventBus.emit('particle:burst', { type: 'bubble', x: cx, y: cy, count: 3, emotion: 'curious' })
      break
  }
}

// ── 初始化 ──

export function initParticleSystem(): void {
  ensureCanvas()

  // 预分配池
  for (let i = 0; i < MAX_PARTICLES; i++) pool.push({} as Particle)

  // 订阅爆发事件
  eventBus.on<ParticleBurstPayload>('particle:burst', (payload) => {
    if (!payload || payload.count <= 0) return
    spawnBurst(payload)
    if (!isRunning) {
      isRunning = true
      rafId = requestAnimationFrame(loop)
    }
  })

  // 订阅情绪联动
  eventBus.on('emotion', autoTriggerOnEmotion)

  console.log(`[ParticleSystem] 已初始化 — 池:${MAX_PARTICLES} 事件驱动`)
}
