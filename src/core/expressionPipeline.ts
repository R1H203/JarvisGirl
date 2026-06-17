/**
 * ExpressionPipeline — 表情/动作管道
 *
 * 职责: 监听 stateMachine 状态变更 → 解析情绪 → 解析动作 → 广播事件
 * 不直接操作渲染，只引发 eventBus 事件供其他模块消费
 */

import { eventBus } from './eventBus'
import { stateMachine, PetState } from './stateMachine'
import { Emotion, resolveEmotion, IDLE_EMOTION_WEIGHTS, ALL_EMOTIONS } from './emotion'
import { Action, resolveAction, ACTION_DURATION } from './action'

/** 当前情绪（外部可读） */
let _currentEmotion: Emotion = Emotion.Neutral
export function getCurrentEmotion(): Emotion { return _currentEmotion }

/** 当前动作（外部可读） */
let _currentAction: Action = Action.IdleBreathe
export function getCurrentAction(): Action { return _currentAction }

/** 加权随机选取空闲微表情 */
function randomIdleEmotion(): Emotion {
  const w = IDLE_EMOTION_WEIGHTS
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const emotion of ALL_EMOTIONS) {
    r -= w[emotion]
    if (r <= 0) return emotion
  }
  return Emotion.Neutral
}

/** 空闲微表情定时器 */
let _idleEmotionTimer: ReturnType<typeof setTimeout> | null = null

function scheduleIdleEmotionCheck(): void {
  if (_idleEmotionTimer) clearTimeout(_idleEmotionTimer)
  _idleEmotionTimer = setTimeout(() => {
    const state = stateMachine.state
    if (state === PetState.Idle) {
      const emotion = randomIdleEmotion()
      applyEmotion(emotion, 'idle_random')
    }
    // 持续调度
    const nextInterval = 5000 + Math.random() * 8000 // 5-13 秒
    _idleEmotionTimer = setTimeout(scheduleIdleEmotionCheck, nextInterval)
  }, 5000)
}

/** 应用情绪：广播 emotion 事件 */
function applyEmotion(emotion: Emotion, reason: string): void {
  if (emotion === _currentEmotion) return
  _currentEmotion = emotion
  eventBus.emit('emotion', { emotion, reason })
}

/** 应用动作：广播 action 事件 */
function applyAction(action: Action, reason: string): void {
  if (action === _currentAction && action === Action.IdleBreathe) return
  _currentAction = action
  eventBus.emit('action', { action, duration: ACTION_DURATION[action] ?? 0, reason })
}

/** 连接状态变更 → 情绪 + 动作 */
function handleStateChange(payload: { prev: string; current: string }): void {
  // 状态变更 → 解决情绪
  const emotion = resolveEmotion(payload.current)
  applyEmotion(emotion, `state:${payload.current}`)

  // 情绪 + 状态 → 解决动作
  const action = resolveAction(payload.current, emotion)
  applyAction(action, `state:${payload.current}`)
}

/** 初始化 Expression Pipeline */
export function initExpressionPipeline(): void {
  console.log('[ExpressionPipeline] 初始化...')

  // 订阅状态变更
  eventBus.on('state:change', handleStateChange)

  // 订阅外部事件（可触发情绪临时覆盖）
  eventBus.on('user:trigger', (payload: any) => {
    if (!payload?.event) return
    const emotion = resolveEmotion(stateMachine.state, payload.event)
    if (emotion !== _currentEmotion) {
      applyEmotion(emotion, `trigger:${payload.event}`)
    }
  })

  // 启动空闲微表情
  scheduleIdleEmotionCheck()

  // 初始情绪 + 动作
  const initialEmotion = resolveEmotion(stateMachine.state)
  const initialAction = resolveAction(stateMachine.state, initialEmotion)
  applyEmotion(initialEmotion, 'init')
  applyAction(initialAction, 'init')

  console.log(`[ExpressionPipeline] 初始: ${initialEmotion} / ${initialAction}`)
}

/** 立即触发一次手动情绪+动作 */
export function triggerExpression(event: string): void {
  eventBus.emit('user:trigger', { event })
}
