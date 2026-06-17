/**
 * Live2DDriver v2 — Live2D 模型驱动层（修复: 参数持久化、focus 支持）
 *
 * 职责:
 *   - emotion → model.focus() + Cubism 参数操控（通过 modelUpdate 回调持久化）
 *   - action → model.motion() 播放
 *   - 鼠标 → ParamAngleX/Y 头部跟随（每帧持久化）
 *
 * 修复要点:
 *   1. 用 model.on('modelUpdate') 回调设置参数 → 避免被自动更新覆盖
 *   2. 缓存参数索引 → 避免每帧重复查找
 *   3. 不静默吞错误
 */

import { eventBus } from './eventBus'
import { Emotion } from './emotion'
import { Action } from './action'
import { Live2DModel } from 'pixi-live2d-display'
import type { MouseMovePayload } from './mouseTracker'

/** 模型引用 */
let _model: Live2DModel | null = null
/** 取消 modelUpdate 监听的函数 */
let _unsubUpdate: (() => void) | null = null

/** 当前正在播放的动作（防重叠） */
let _busyUntil = 0

// ── 参数索引缓存 ──
const PARAM_CACHE = new Map<string, number>()
function cachedParamIndex(model: Live2DModel, id: string): number {
  let idx = PARAM_CACHE.get(id)
  if (idx === undefined) {
    const coreModel = (model as any).internalModel?.coreModel
    if (!coreModel || typeof coreModel.getParameterIndex !== 'function') return -1
    idx = coreModel.getParameterIndex(id)
    PARAM_CACHE.set(id, idx)
  }
  return idx ?? -1
}

/** 在 modelUpdate 回调中设置的参数（每帧持久化） */
const PENDING_PARAMS = new Map<number, number>()

/** 设置参数值（加入等待队列） */
function queueParam(id: string, value: number): void {
  if (!_model) return
  const idx = cachedParamIndex(_model, id)
  if (idx >= 0) {
    PENDING_PARAMS.set(idx, value)
  }
}

/** modelUpdate 回调: 应用所有待处理参数 */
function onModelUpdate(): void {
  if (PENDING_PARAMS.size === 0 || !_model) return
  const coreModel = (_model as any).internalModel?.coreModel
  if (!coreModel || typeof coreModel.setParameterValue !== 'function') return
  PENDING_PARAMS.forEach((value, idx) => {
    coreModel.setParameterValue(idx, value)
  })
}

/** 已知参数列表（仅用于命中率检查） */
const KNOWN_PARAMS = [
  'ParamAngleX', 'ParamAngleY', 'ParamAngleZ',
  'ParamEyeBallX', 'ParamEyeBallY',
  'ParamEyeLOpen', 'ParamEyeROpen',
  'ParamMouthForm', 'ParamMouthOpenY',
  'ParamBreath', 'ParamBodyAngleX', 'ParamBodyAngleY',
  'ParamHairFront', 'ParamHairSide', 'ParamHairBack',
  'ParamTailX', 'ParamTailY',
  'ParamBrowX', 'ParamBrowY',
]

/** 情绪 → 参数映射 */
interface ParamAdjustment { id: string; value: number }

const EMOTION_PARAMS: Record<Emotion, ParamAdjustment[]> = {
  [Emotion.Neutral]: [
    { id: 'ParamAngleX', value: 0 }, { id: 'ParamAngleY', value: 0 },
    { id: 'ParamEyeLOpen', value: 1 }, { id: 'ParamEyeROpen', value: 1 },
    { id: 'ParamMouthForm', value: 0 }, { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Happy]: [
    { id: 'ParamAngleX', value: 0 }, { id: 'ParamAngleY', value: -5 },
    { id: 'ParamEyeLOpen', value: 1 }, { id: 'ParamEyeROpen', value: 1 },
    { id: 'ParamMouthForm', value: 0.5 }, { id: 'ParamMouthOpenY', value: 0.1 },
  ],
  [Emotion.Sad]: [
    { id: 'ParamAngleX', value: 0 }, { id: 'ParamAngleY', value: 10 },
    { id: 'ParamEyeLOpen', value: 0.5 }, { id: 'ParamEyeROpen', value: 0.5 },
    { id: 'ParamMouthForm', value: -0.3 }, { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Angry]: [
    { id: 'ParamAngleX', value: 0 }, { id: 'ParamAngleY', value: 5 },
    { id: 'ParamEyeLOpen', value: 0.7 }, { id: 'ParamEyeROpen', value: 0.7 },
    { id: 'ParamMouthForm', value: -0.5 }, { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Surprised]: [
    { id: 'ParamAngleX', value: 0 }, { id: 'ParamAngleY', value: -10 },
    { id: 'ParamEyeLOpen', value: 1.3 }, { id: 'ParamEyeROpen', value: 1.3 },
    { id: 'ParamMouthForm', value: 0.5 }, { id: 'ParamMouthOpenY', value: 0.8 },
  ],
  [Emotion.Curious]: [
    { id: 'ParamAngleX', value: 10 }, { id: 'ParamAngleY', value: 0 },
    { id: 'ParamEyeLOpen', value: 0.8 }, { id: 'ParamEyeROpen', value: 0.8 },
    { id: 'ParamMouthForm', value: 0.2 }, { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Sleepy]: [
    { id: 'ParamAngleX', value: 0 }, { id: 'ParamAngleY', value: 5 },
    { id: 'ParamEyeLOpen', value: 0.2 }, { id: 'ParamEyeROpen', value: 0.2 },
    { id: 'ParamMouthForm', value: 0 }, { id: 'ParamMouthOpenY', value: 0 },
  ],
}

/** 动作 → Live2D motion 映射 */
interface MotionMapping {
  group: string
  index?: number
  priority: number
}

const ACTION_MOTIONS: Partial<Record<Action, MotionMapping>> = {
  [Action.IdleBreathe]: { group: 'Idle', priority: 1 },
  [Action.Nod]: { group: 'Tap', priority: 2 },
  [Action.Shake]: { group: 'Tap', priority: 2 },
  [Action.React]: { group: 'Taphead', priority: 2 },
  [Action.Sleep]: { group: 'Taphead', index: 1, priority: 2 },
  [Action.Wake]: { group: 'Tap', priority: 2 },
  [Action.Listen]: { group: 'Idle', priority: 1 },
  [Action.Speak]: { group: 'Taphead', index: 0, priority: 2 },
  [Action.Stretch]: { group: 'Taphead', priority: 2 },
  [Action.TiltHead]: { group: 'Idle', priority: 1 },
  [Action.LookAtUser]: { group: 'Idle', priority: 1 },
}

/** 发现模型的所有参数 */
export function discoverParameters(model: Live2DModel): void {
  const coreModel = (model as any).internalModel?.coreModel
  if (!coreModel || typeof coreModel.getParameterCount !== 'function') {
    console.warn('[Live2DDriver] 无法访问 coreModel')
    return
  }

  const count = coreModel.getParameterCount()
  const params: string[] = []
  for (let i = 0; i < count; i++) {
    try {
      params.push(coreModel.getParameterId(i))
    } catch { /* skip */ }
  }
  console.log(`[Live2DDriver] 模型参数 (${params.length}):`, params)

  // 检查已知参数
  const found = KNOWN_PARAMS.filter(p => params.includes(p))
  const missing = KNOWN_PARAMS.filter(p => !params.includes(p))
  console.log(`[Live2DDriver] 可操控参数: ${found.length}/${KNOWN_PARAMS.length}`)
  if (found.length > 0) console.log(`[Live2DDriver] 可用: [${found.join(', ')}]`)
  if (missing.length > 0) console.log(`[Live2DDriver] 模型无: [${missing.join(', ')}]`)
}

/** 应用情绪参数（加入持久化队列） */
function applyEmotionToModel(emotion: Emotion): void {
  const adjustments = EMOTION_PARAMS[emotion]
  if (!adjustments) return

  for (const adj of adjustments) {
    queueParam(adj.id, adj.value)
  }

  console.log(`[Live2DDriver] 表情 → ${emotion}`)
}

/** 播放动作 */
async function playAction(action: Action): Promise<void> {
  if (!_model) return

  const mapping = ACTION_MOTIONS[action]
  if (!mapping) return

  const now = Date.now()
  if (now < _busyUntil) {
    if (mapping.priority <= 1) return
    if (mapping.priority === 2 && now < _busyUntil - 300) return
  }

  try {
    _busyUntil = now + 1500
    await (_model as any).motion(mapping.group, mapping.index, mapping.priority)
  } catch (err) {
    console.warn(`[Live2DDriver] 动作失败: ${action}`, err)
  }
}

/** 设置模型引用并注册回调 */
export function setLive2DModel(model: Live2DModel): void {
  _model = model

  console.log('[Live2DDriver] 模型已注册')

  // 发现参数
  discoverParameters(model)
  // 预缓存已知参数索引
  KNOWN_PARAMS.forEach(id => cachedParamIndex(model, id))

  // 注册 modelUpdate 回调（每帧渲染前执行 → 参数持久化）
  model.on('modelUpdate', onModelUpdate)
  _unsubUpdate = () => { model.off('modelUpdate', onModelUpdate) }

  // 订阅情绪
  const unsubEmotion = eventBus.on<{ emotion: Emotion }>('emotion', (payload) => {
    if (payload?.emotion) applyEmotionToModel(payload.emotion)
  })

  // 订阅动作
  const unsubAction = eventBus.on<{ action: Action }>('action', (payload) => {
    if (payload?.action) playAction(payload.action)
  })

  // 订阅鼠标 → 头部跟随
  const unsubMouse = eventBus.on<MouseMovePayload>('mouse:move', (payload) => {
    if (!payload) return
    const vx = payload.nx * 15
    const vy = payload.ny * 8
    queueParam('ParamAngleX', vx)
    queueParam('ParamAngleY', vy)
  })

  console.log('[Live2DDriver] 已订阅 modelUpdate/emotion/action/mouse:move')

  return () => {
    _unsubUpdate?.()
    unsubEmotion()
    unsubAction()
    unsubMouse()
    _model = null
    PARAM_CACHE.clear()
    PENDING_PARAMS.clear()
  }
}

/** 获取参数快照 */
export function dumpModelParams(): Record<string, number> {
  if (!_model) return {}
  const coreModel = (_model as any).internalModel?.coreModel
  if (!coreModel || typeof coreModel.getParameterCount !== 'function') return {}
  const snap: Record<string, number> = {}
  const count = coreModel.getParameterCount()
  for (let i = 0; i < count; i++) {
    try {
      snap[coreModel.getParameterId(i)] = coreModel.getParameterValue(i)
    } catch { /* skip */ }
  }
  return snap
}

/** 清理 Live2D 驱动（切换角色时使用） */
export function clearLive2DModel(): void {
  if (_unsubUpdate) {
    _unsubUpdate()
    _unsubUpdate = null
  }
  _model = null
  PARAM_CACHE.clear()
  PENDING_PARAMS.clear()
}
