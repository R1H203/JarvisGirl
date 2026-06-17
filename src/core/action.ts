/**
 * Action — 动作系统
 *
 * 职责: 定义桌宠动作 + 状态/情绪→动作映射表
 * 约束: 纯数据，无副作用，不依赖渲染
 */

import { Emotion } from './emotion'

export enum Action {
  IdleBreathe = 'idle_breathe',
  LookAtUser = 'look_at_user',
  Nod = 'nod',
  Shake = 'shake',
  React = 'react',
  Sleep = 'sleep',
  Wake = 'wake',
  Listen = 'listen',
  Speak = 'speak',
  Stretch = 'stretch',
  TiltHead = 'tilt_head',
}

/** 所有动作列表 */
export const ALL_ACTIONS = Object.values(Action)

/**
 * 动作预计时长（ms），用于:
 * - 决定何时可播放下一个动作
 * - 防止动作叠加
 */
export const ACTION_DURATION: Record<Action, number> = {
  [Action.IdleBreathe]: 0,      // 循环动作，无固定时长
  [Action.LookAtUser]: 2000,
  [Action.Nod]: 800,
  [Action.Shake]: 1000,
  [Action.React]: 1200,
  [Action.Sleep]: 0,
  [Action.Wake]: 600,
  [Action.Listen]: 0,
  [Action.Speak]: 0,
  [Action.Stretch]: 1500,
  [Action.TiltHead]: 1000,
}

/**
 * 情绪权重 → 动作选择
 * 相同 state+emotion 可能有多个候选，对应不同权重
 */
type ActionCandidate = { action: Action; weight: number }

/** State + Emotion → 动作候选列表 */
const ACTION_CANDIDATES: Record<string, Array<ActionCandidate>> = {
  // ── Idle 状态 ──
  'idle_neutral': [{ action: Action.IdleBreathe, weight: 70 }, { action: Action.LookAtUser, weight: 20 }, { action: Action.Stretch, weight: 10 }],
  'idle_happy': [{ action: Action.TiltHead, weight: 50 }, { action: Action.IdleBreathe, weight: 40 }, { action: Action.React, weight: 10 }],
  'idle_sad': [{ action: Action.IdleBreathe, weight: 60 }, { action: Action.TiltHead, weight: 30 }, { action: Action.LookAtUser, weight: 10 }],
  'idle_angry': [{ action: Action.IdleBreathe, weight: 50 }, { action: Action.Shake, weight: 30 }, { action: Action.TiltHead, weight: 20 }],
  'idle_surprised': [{ action: Action.React, weight: 50 }, { action: Action.LookAtUser, weight: 30 }, { action: Action.IdleBreathe, weight: 20 }],
  'idle_curious': [{ action: Action.TiltHead, weight: 50 }, { action: Action.LookAtUser, weight: 30 }, { action: Action.IdleBreathe, weight: 20 }],
  'idle_sleepy': [{ action: Action.Sleep, weight: 60 }, { action: Action.IdleBreathe, weight: 30 }, { action: Action.TiltHead, weight: 10 }],

  // ── Listening 状态 ──
  'listening_neutral': [{ action: Action.Listen, weight: 50 }, { action: Action.TiltHead, weight: 30 }, { action: Action.LookAtUser, weight: 20 }],
  'listening_curious': [{ action: Action.TiltHead, weight: 50 }, { action: Action.Listen, weight: 30 }, { action: Action.LookAtUser, weight: 20 }],
  'listening_surprised': [{ action: Action.React, weight: 50 }, { action: Action.TiltHead, weight: 30 }, { action: Action.Listen, weight: 20 }],
  'listening_happy': [{ action: Action.Nod, weight: 50 }, { action: Action.Listen, weight: 30 }, { action: Action.React, weight: 20 }],
  'listening_sad': [{ action: Action.Listen, weight: 50 }, { action: Action.TiltHead, weight: 30 }, { action: Action.IdleBreathe, weight: 20 }],

  // ── Speaking 状态 ──
  'speaking_neutral': [{ action: Action.Speak, weight: 60 }, { action: Action.Nod, weight: 30 }, { action: Action.LookAtUser, weight: 10 }],
  'speaking_happy': [{ action: Action.Speak, weight: 50 }, { action: Action.Nod, weight: 30 }, { action: Action.React, weight: 20 }],
  'speaking_angry': [{ action: Action.Shake, weight: 50 }, { action: Action.Speak, weight: 30 }, { action: Action.TiltHead, weight: 20 }],
  'speaking_curious': [{ action: Action.TiltHead, weight: 40 }, { action: Action.Speak, weight: 40 }, { action: Action.Nod, weight: 20 }],

  // ── Reacting 状态 ──
  'reacting_neutral': [{ action: Action.React, weight: 50 }, { action: Action.LookAtUser, weight: 30 }, { action: Action.IdleBreathe, weight: 20 }],
  'reacting_happy': [{ action: Action.React, weight: 40 }, { action: Action.Nod, weight: 30 }, { action: Action.TiltHead, weight: 30 }],
  'reacting_surprised': [{ action: Action.React, weight: 60 }, { action: Action.LookAtUser, weight: 30 }, { action: Action.IdleBreathe, weight: 10 }],
  'reacting_angry': [{ action: Action.Shake, weight: 50 }, { action: Action.React, weight: 30 }, { action: Action.TiltHead, weight: 20 }],
}

/** 加权随机选择一个动作 */
function weightedRandom(candidates: ActionCandidate[]): Action {
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0)
  let r = Math.random() * totalWeight
  for (const c of candidates) {
    r -= c.weight
    if (r <= 0) return c.action
  }
  return candidates[0].action
}

/** 解析动作: state + emotion → 动作 */
export function resolveAction(state: string, emotion: Emotion): Action {
  const key = `${state}_${emotion}`
  const candidates = ACTION_CANDIDATES[key]
  if (!candidates || candidates.length === 0) {
    // fallback: 按状态的默认动作
    return state === 'idle' ? Action.IdleBreathe
      : state === 'listening' ? Action.Listen
      : state === 'speaking' ? Action.Speak
      : Action.React
  }
  return weightedRandom(candidates)
}
