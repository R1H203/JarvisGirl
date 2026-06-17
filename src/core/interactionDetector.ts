/**
 * InteractionDetector — B: 点击交互 + C: 边缘/接近检测
 *
 * B: 单击/双击/长按 → 状态变更 + 粒子爆发 + 表情/动作
 * C: 鼠标进入窗口 → 狐狸注意 / 鼠标接近 → 轻反应 / 鼠标离开 → 放松
 *
 * 约束:
 *   - 使用原生 Canvas pointer 事件（不与 PixiJS 事件系统冲突）
 *   - 通过 eventBus 通信
 *   - 点击确认后才调用 start_drag（单击不触发拖动）
 */

import { eventBus } from './eventBus'
import { stateMachine, PetState } from './stateMachine'
import { triggerExpression } from './expressionPipeline'

// ── B: 点击状态 ──
let _isPressed = false
let _isDragging = false
let _pressTime = 0
let _pressPos = { x: 0, y: 0 }

let _clickCount = 0
let _lastClickTime = 0
let _clickTimer: ReturnType<typeof setTimeout> | null = null

const CLICK_THRESHOLD = 8    // px — 超过此距离算拖动
const LONG_PRESS_MS = 500    // ms
const DOUBLE_TAP_MS = 350    // ms

/** 拖动回调（由 main.ts 注入 Tauri invoke） */
let _startDrag: (() => void) | null = null

// ── C: 接近/边缘状态 ──
let _isMouseNear = false
let _isMouseInWindow = false
const PROXIMITY_DIST = 180          // px — 接近阈值
const PROXIMITY_HYSTERESIS = 40     // px — 防止反复触发

// ── B: 点击处理 ──

function onPointerDown(e: PointerEvent): void {
  if (e.button !== 0) return
  _isPressed = true
  _isDragging = false
  _pressTime = Date.now()
  _pressPos = { x: e.clientX, y: e.clientY }
}

function onPointerMove(e: PointerEvent): void {
  if (!_isPressed || _isDragging) return
  const dx = Math.abs(e.clientX - _pressPos.x)
  const dy = Math.abs(e.clientY - _pressPos.y)
  if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) {
    _isDragging = true
    _isPressed = false // 不算点击了
    _startDrag?.()
  }
}

function onPointerUp(e: PointerEvent): void {
  if (e.button !== 0) return
  const wasDragging = _isDragging
  _isPressed = false
  _isDragging = false

  if (!wasDragging && _pressTime > 0) {
    processClick(e.clientX, e.clientY)
  }
  _pressTime = 0
}

function processClick(x: number, y: number): void {
  const dt = Date.now() - _pressTime

  if (dt < 200) {
    // 单击 → 等待双击判定
    _clickCount++
    if (_clickCount >= 2 && (Date.now() - _lastClickTime) < DOUBLE_TAP_MS) {
      // 双击确认
      if (_clickTimer) clearTimeout(_clickTimer)
      _clickTimer = null
      _clickCount = 0
      onDoubleTap(x, y)
    } else {
      _lastClickTime = Date.now()
      if (_clickTimer) clearTimeout(_clickTimer)
      _clickTimer = setTimeout(() => {
        if (_clickCount === 1) {
          _clickCount = 0
          onTap(x, y)
        }
      }, DOUBLE_TAP_MS)
    }
  } else if (dt >= LONG_PRESS_MS) {
    // 长按
    _clickCount = 0
    onLongPress(x, y)
  }
}

function onTap(x: number, y: number): void {
  console.log(`[Interaction] 单击 @ (${x}, ${y})`)
  stateMachine.setState(PetState.Reacting)
  setTimeout(() => stateMachine.setState(PetState.Idle), 1500)
  eventBus.emit('particle:burst', { type: 'sparkle', x, y, count: 8, emotion: 'surprised' })
}

function onDoubleTap(x: number, y: number): void {
  console.log(`[Interaction] 双击 @ (${x}, ${y})`)
  stateMachine.setState(PetState.Reacting)
  setTimeout(() => stateMachine.setState(PetState.Idle), 2000)
  eventBus.emit('particle:burst', { type: 'heart', x, y, count: 15, emotion: 'happy' })
}

function onLongPress(x: number, y: number): void {
  console.log(`[Interaction] 长按 @ (${x}, ${y})`)
  stateMachine.setState(PetState.Reacting)
  setTimeout(() => stateMachine.setState(PetState.Idle), 2000)
  eventBus.emit('particle:burst', { type: 'star', x, y, count: 12, emotion: 'surprised' })
}

// ── C: 接近检测 ──

function getModelCenter(): { x: number; y: number } {
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.78 }
}

function onMouseMove(payload: any): void {
  if (!payload) return
  const center = getModelCenter()
  const dx = payload.clientX - center.x
  const dy = payload.clientY - center.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  const threshold = _isMouseNear
    ? PROXIMITY_DIST + PROXIMITY_HYSTERESIS
    : PROXIMITY_DIST

  if (dist < threshold && !_isMouseNear) {
    _isMouseNear = true
    eventBus.emit('proximity:enter', { distance: dist })
    triggerExpression('click:tap')
  } else if (dist >= threshold && _isMouseNear) {
    _isMouseNear = false
    eventBus.emit('proximity:leave', {})
  }
}

// ── C: 窗口边缘检测 ──

function onDocMouseEnter(): void {
  if (_isMouseInWindow) return
  _isMouseInWindow = true
  eventBus.emit('window:enter', {})
  triggerExpression('wake')
  stateMachine.setState(PetState.Listening)
  setTimeout(() => stateMachine.setState(PetState.Idle), 2500)
}

function onDocMouseLeave(): void {
  _isMouseInWindow = false
  _isMouseNear = false
  eventBus.emit('window:leave', {})
}

// ── 初始化 ──

export function initInteractionDetector(
  canvas: HTMLCanvasElement,
  callbacks?: { startDrag?: () => void },
): void {
  _startDrag = callbacks?.startDrag ?? null

  // B: 原生 Canvas pointer 事件（不依赖 PixiJS 事件系统）
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)

  // 安全兜底：窗口层面释放
  window.addEventListener('pointerup', () => { _isPressed = false; _isDragging = false })

  // C: 接近检测（订阅 mouseTracker 坐标）
  const unsubMove = eventBus.on('mouse:move', onMouseMove)

  // C: 窗口进出
  document.addEventListener('mouseenter', onDocMouseEnter)
  document.addEventListener('mouseleave', onDocMouseLeave)

  console.log('[InteractionDetector] 已初始化 — 点击检测 + 接近感应')
}
