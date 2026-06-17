/**
 * Live2DDriver — Live2D 模型驱动层
 *
 * 职责: 订阅 eventBus 的 emotion/action 事件 → 操控 Cubism 模型
 *   - emotion → 参数操控（因 Senko 模型无 .exp3）
 *   - action → model.motion() 播放动作
 *
 * 约束:
 *   - 不改 PixiJS render loop
 *   - 不改模型加载逻辑
 *   - 所有操控通过 Cubism SDK API 完成
 */

import { eventBus } from './eventBus'
import { Emotion } from './emotion'
import { Action } from './action'
import { Live2DModel } from 'pixi-live2d-display'

/** 模型引用（由 main.ts 设置） */
let _model: Live2DModel | null = null
/** 当前正在播放的动作（防重叠） */
let _busyUntil = 0

/**
 * 已知的 Cubism 参数 ID（Senko 模型可能存在其中一部分）
 * 实际参数清单在 setModel() 时自动发现并输出到 console
 */
const KNOWN_PARAMS = [
  'ParamAngleX', 'ParamAngleY', 'ParamAngleZ',
  'ParamEyeBallX', 'ParamEyeBallY',
  'ParamEyeLOpen', 'ParamEyeROpen',
  'ParamMouthForm', 'ParamMouthOpenY',
  'ParamBreath', 'ParamBodyAngleX', 'ParamBodyAngleY',
  'ParamHairFront', 'ParamHairSide', 'ParamHairBack',
  'ParamTailX', 'ParamTailY',
  'ParamBrowX', 'ParamBrowY',
  'ParamLeftNnose', // hmm, not standard
]

/** 已发现的参数 ID（模型实际拥有的） */
let discoveredParams: string[] = []

/** 情绪 → 参数值映射（值范围 -1.0 ~ 1.0，具体范围由模型定义） */
interface ParamAdjustment { id: string; value: number }

const EMOTION_PARAMS: Record<Emotion, ParamAdjustment[]> = {
  [Emotion.Neutral]: [
    { id: 'ParamAngleX', value: 0 },
    { id: 'ParamAngleY', value: 0 },
    { id: 'ParamEyeLOpen', value: 1 },
    { id: 'ParamEyeROpen', value: 1 },
    { id: 'ParamMouthForm', value: 0 },
    { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Happy]: [
    { id: 'ParamAngleX', value: 0 },
    { id: 'ParamAngleY', value: -5 },
    { id: 'ParamEyeLOpen', value: 1 },
    { id: 'ParamEyeROpen', value: 1 },
    { id: 'ParamMouthForm', value: 0.5 },
    { id: 'ParamMouthOpenY', value: 0.1 },
  ],
  [Emotion.Sad]: [
    { id: 'ParamAngleX', value: 0 },
    { id: 'ParamAngleY', value: 10 },
    { id: 'ParamEyeLOpen', value: 0.5 },
    { id: 'ParamEyeROpen', value: 0.5 },
    { id: 'ParamMouthForm', value: -0.3 },
    { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Angry]: [
    { id: 'ParamAngleX', value: 0 },
    { id: 'ParamAngleY', value: 5 },
    { id: 'ParamEyeLOpen', value: 0.7 },
    { id: 'ParamEyeROpen', value: 0.7 },
    { id: 'ParamMouthForm', value: -0.5 },
    { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Surprised]: [
    { id: 'ParamAngleX', value: 0 },
    { id: 'ParamAngleY', value: -10 },
    { id: 'ParamEyeLOpen', value: 1.3 },
    { id: 'ParamEyeROpen', value: 1.3 },
    { id: 'ParamMouthForm', value: 0.5 },
    { id: 'ParamMouthOpenY', value: 0.8 },
  ],
  [Emotion.Curious]: [
    { id: 'ParamAngleX', value: 10 },
    { id: 'ParamAngleY', value: 0 },
    { id: 'ParamEyeLOpen', value: 0.8 },
    { id: 'ParamEyeROpen', value: 0.8 },
    { id: 'ParamMouthForm', value: 0.2 },
    { id: 'ParamMouthOpenY', value: 0 },
  ],
  [Emotion.Sleepy]: [
    { id: 'ParamAngleX', value: 0 },
    { id: 'ParamAngleY', value: 5 },
    { id: 'ParamEyeLOpen', value: 0.2 },
    { id: 'ParamEyeROpen', value: 0.2 },
    { id: 'ParamMouthForm', value: 0 },
    { id: 'ParamMouthOpenY', value: 0 },
  ],
}

/** 动作 → Live2D motion 映射 */
interface MotionMapping {
  group: string     // motion group name in model3.json
  index?: number    // motion index within group (空 = 随机)
  priority: number  // 0=none, 1=idle, 2=normal, 3=forced
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

/** 应用参数值（仅当参数存在时） */
function setParamByIndex(model: Live2DModel, paramIndex: number, value: number): void {
  try {
    const coreModel = (model as any).internalModel?.coreModel
    if (!coreModel || typeof coreModel.setParameterValue !== 'function') return
    coreModel.setParameterValue(paramIndex, value)
  } catch {
    // 静默忽略——某些参数可能不可写
  }
}

/** 查找参数索引 */
function findParamIndex(model: Live2DModel, id: string): number {
  try {
    const coreModel = (model as any).internalModel?.coreModel
    if (!coreModel || typeof coreModel.getParameterIndex !== 'function') return -1
    return coreModel.getParameterIndex(id)
  } catch {
    return -1
  }
}

/** 发现模型的所有参数并缓存 */
function discoverParameters(model: Live2DModel): void {
  try {
    const coreModel = (model as any).internalModel?.coreModel
    if (!coreModel || typeof coreModel.getParameterCount !== 'function') {
      console.warn('[Live2DDriver] 无法访问 coreModel，参数发现失败')
      return
    }

    const count = coreModel.getParameterCount()
    const params: string[] = []
    for (let i = 0; i < count; i++) {
      try {
        const id = coreModel.getParameterId(i)
        params.push(id)
      } catch { /* skip */ }
    }
    discoveredParams = params
    console.log(`[Live2DDriver] 发现 ${params.length} 个参数:`, params)

    // 检查我们的已知参数哪些存在
    const found = KNOWN_PARAMS.filter(p => params.includes(p))
    const missing = KNOWN_PARAMS.filter(p => !params.includes(p))
    console.log(`[Live2DDriver] 已知参数命中: ${found.length}/${KNOWN_PARAMS.length}`)
    if (missing.length > 0) console.log(`[Live2DDriver] 未命中: [${missing.join(', ')}]`)
  } catch (err) {
    console.warn('[Live2DDriver] 参数发现失败:', err)
  }
}

/** 应用情绪至模型参数 */
function applyEmotionToModel(emotion: Emotion): void {
  if (!_model) return

  const adjustments = EMOTION_PARAMS[emotion]
  if (!adjustments) return

  // 每次情绪变化都重新查找参数索引（参数索引在模型生命周期内不变，性能可接受）
  for (const adj of adjustments) {
    const idx = findParamIndex(_model, adj.id)
    if (idx >= 0) {
      setParamByIndex(_model, idx, adj.value)
    }
  }

  console.log(`[Live2DDriver] 表情: ${emotion}`)
}

/** 播放动作 */
async function playAction(action: Action): Promise<void> {
  if (!_model) return

  const mapping = ACTION_MOTIONS[action]
  if (!mapping) return

  const now = Date.now()
  if (now < _busyUntil) {
    // 当前动作还在进行，跳过低优先级动作
    if (mapping.priority <= 1) return
    // 高优先级可以打断低优先级（有限度）
    if (mapping.priority === 2 && now < _busyUntil - 300) return
  }

  try {
    _busyUntil = now + 1500 // 默认 busy 1.5s
    await (_model as any).motion(mapping.group, mapping.index, mapping.priority)
  } catch (err) {
    console.warn(`[Live2DDriver] 动作失败: ${action}`, err)
  }
}

/** 设置模型引用 */
export function setLive2DModel(model: Live2DModel): void {
  _model = model

  console.log('[Live2DDriver] 模型已注册')

  // 发现模型参数
  discoverParameters(model)

  // 订阅情绪事件 → 参数操控
  const unsubEmotion = eventBus.on<{ emotion: Emotion }>('emotion', (payload) => {
    if (payload?.emotion) {
      applyEmotionToModel(payload.emotion)
    }
  })

  // 订阅动作事件 → 播放动作
  const unsubAction = eventBus.on<{ action: Action }>('action', (payload) => {
    if (payload?.action) {
      playAction(payload.action)
    }
  })

  console.log('[Live2DDriver] 已订阅 emotion/action 事件')

  // 返回取消订阅函数（供清理使用）
  return () => {
    unsubEmotion()
    unsubAction()
    _model = null
  }
}

/** 获取模型参数快照（调试用） */
export function dumpModelParams(): Record<string, number> {
  if (!_model) return {}
  const coreModel = (_model as any).internalModel?.coreModel
  if (!coreModel || typeof coreModel.getParameterCount !== 'function') return {}

  const snapshot: Record<string, number> = {}
  const count = coreModel.getParameterCount()
  for (let i = 0; i < count; i++) {
    try {
      const id = coreModel.getParameterId(i)
      const value = coreModel.getParameterValue(i)
      snapshot[id] = value
    } catch { /* skip */ }
  }
  return snapshot
}
