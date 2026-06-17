/**
 * MouseTracker — 鼠标追踪模块
 *
 * 职责: 监听鼠标移动 → 驱动 Live2D 视线跟随 + 头部微转
 * 约束: 只通过 EventBus 和 Live2DModel API 交互，不改渲染循环
 */

import { eventBus } from './eventBus'
import { Live2DModel } from 'pixi-live2d-display'

/** 模型引用 */
let _model: Live2DModel | null = null

/** 窗口尺寸 */
let _winW = window.innerWidth
let _winH = window.innerHeight

/** 上次发送视线事件的时间（节流） */
let _lastFocusTime = 0
const FOCUS_THROTTLE_MS = 50 // 20fps 视线更新

/** 鼠标在窗口中的归一化位置 (-1 ~ 1) */
let _mouseNX = 0
let _mouseNY = 0

/** 是否启用 */
let _enabled = true

/** 鼠标移动处理器 */
function onMouseMove(e: MouseEvent): void {
  if (!_enabled || !_model) return

  // 归一化坐标: 鼠标位置相对于窗口中心，范围 -1 ~ 1
  _mouseNX = (e.clientX / _winW) * 2 - 1
  _mouseNY = (e.clientY / _winH) * 2 - 1

  // 节流视线更新
  const now = Date.now()
  if (now - _lastFocusTime < FOCUS_THROTTLE_MS) return
  _lastFocusTime = now

  // 1. 视线跟随 (pixi-live2d-display 原生 API)
  try {
    _model.focus(_mouseNX, _mouseNY)
  } catch { /* 某些模型可能不支持 */ }

  // 2. 广播鼠标位置事件（供其他模块消费）
  eventBus.emit('mouse:move', {
    nx: _mouseNX,
    ny: _mouseNY,
    clientX: e.clientX,
    clientY: e.clientY,
  } as MouseMovePayload)
}

/** 窗口尺寸更新 */
function onResize(): void {
  _winW = window.innerWidth
  _winH = window.innerHeight
}

export interface MouseMovePayload {
  nx: number   // -1 ~ 1
  ny: number   // -1 ~ 1
  clientX: number
  clientY: number
}

/** 注册模型开始追踪 */
export function startMouseTracking(model: Live2DModel): void {
  _model = model

  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })

  // 订阅 enable/disable 事件
  const unsubEnable = eventBus.on('mouse:tracking:set', (payload: any) => {
    _enabled = payload?.enabled ?? true
  })

  console.log('[MouseTracker] 已启动 — 视线跟随 + 鼠标位置广播')

  return () => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('resize', onResize)
    unsubEnable()
    _model = null
  }
}

/** 切换追踪开关 */
export function setMouseTracking(enabled: boolean): void {
  _enabled = enabled
  eventBus.emit('mouse:tracking:set', { enabled })
}

/** 获取当前鼠标归一化位置 */
export function getMousePosition(): { nx: number; ny: number } {
  return { nx: _mouseNX, ny: _mouseNY }
}
