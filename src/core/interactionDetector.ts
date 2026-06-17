/**
 * InteractionDetector — B: 点击交互 + C: 边缘/接近检测
 *
 * B: 单击 → 表情微变（不播动作，不切换状态）
 *    双击 → 表情变化 + 轻动作
 *    长按 → 表情变化 + 轻动作
 *    拖动确认后才调用 Tauri start_drag
 *
 * C: 鼠标进入窗口 → 表情微变
 *    鼠标离开 → 恢复
 *    靠近狐狸 → 轻触发
 *
 * 约束:
 *   - 使用原生 Canvas pointer 事件（不与 PixiJS 事件系统冲突）
 *   - 所有交互只改变表情参数，不切换 PetState，不播 Live2D motion
 *   - 避免 reaction 动作让模型消失
 */

import { eventBus } from './eventBus'

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
const PROXIMITY_DIST = 180
const PROXIMITY_HYSTERESIS = 40

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
    _clickCount++
    if (_clickCount >= 2 && (Date.now() - _lastClickTime) < DOUBLE_TAP_MS) {
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
    _clickCount = 0
    onLongPress(x, y)
  }
}

// ── 核心原则：只变表情参数，不播 Live2D motion ──

function onTap(_x: number, _y: number): void {
  console.log('[Interaction] 单击')
  // 只临时改表情参数（surprised），3 秒后自动恢复（idleEmotion 循环恢复）
  eventBus.emit('emotion:temp', { emotion: 'surprised', duration: 3000 })
}

function onDoubleTap(_x: number, _y: number): void {
  console.log('[Interaction] 双击')
  eventBus.emit('emotion:temp', { emotion: 'happy', duration: 3000 })
}

function onLongPress(_x: number, _y: number): void {
  console.log('[Interaction] 长按')
  eventBus.emit('emotion:temp', { emotion: 'surprised', duration: 4000 })
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
    eventBus.emit('emotion:temp', { emotion: 'curious', duration: 1500 })
  } else if (dist >= threshold && _isMouseNear) {
    _isMouseNear = false
    eventBus.emit('proximity:leave', {})
  }
}

// ── C: 窗口进出 ──

let _enterTimer: ReturnType<typeof setTimeout> | null = null

function onDocMouseEnter(): void {
  if (_isMouseInWindow) return
  _isMouseInWindow = true
  if (_enterTimer) clearTimeout(_enterTimer)
  eventBus.emit('window:enter', {})
  eventBus.emit('emotion:temp', { emotion: 'curious', duration: 2000 })
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

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerUp)

  window.addEventListener('pointerup', () => { _isPressed = false; _isDragging = false })

  const unsubMove = eventBus.on('mouse:move', onMouseMove)
  document.addEventListener('mouseenter', onDocMouseEnter)
  document.addEventListener('mouseleave', onDocMouseLeave)

  console.log('[InteractionDetector] 已初始化 — 点击表情变化 + 接近感应')
}
