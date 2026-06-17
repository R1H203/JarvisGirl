/**
 * Emotion — 情绪系统
 *
 * 职责: 定义桌宠情绪状态 + 状态→情绪映射表
 * 约束: 纯数据，无副作用，不依赖渲染
 */

export enum Emotion {
  Neutral = 'neutral',
  Happy = 'happy',
  Sad = 'sad',
  Angry = 'angry',
  Surprised = 'surprised',
  Curious = 'curious',
  Sleepy = 'sleepy',
}

/** 所有情绪列表 */
export const ALL_EMOTIONS = Object.values(Emotion)

/** 状态 → 默认情绪映射 */
export const STATE_EMOTION: Record<string, Emotion> = {
  idle: Emotion.Neutral,
  listening: Emotion.Curious,
  speaking: Emotion.Happy,
  reacting: Emotion.Surprised,
}

/** 事件 → 情绪覆盖（临时切换情绪，优先级高于 state） */
export const EVENT_EMOTION: Record<string, Emotion> = {
  'user:speak': Emotion.Curious,
  'user:praise': Emotion.Happy,
  'user:scold': Emotion.Sad,
  'user:silence': Emotion.Neutral,
  'error:network': Emotion.Sad,
  'error:unknown': Emotion.Angry,
  'wake': Emotion.Neutral,
  'sleep': Emotion.Sleepy,
  'click:tap': Emotion.Surprised,
  'click:double': Emotion.Happy,
  'click:long': Emotion.Happy,
}

/** 情绪权重分布（用于空闲时随机微表情） */
export const IDLE_EMOTION_WEIGHTS: Record<Emotion, number> = {
  [Emotion.Neutral]: 60,
  [Emotion.Happy]: 15,
  [Emotion.Curious]: 10,
  [Emotion.Sleepy]: 8,
  [Emotion.Sad]: 3,
  [Emotion.Angry]: 2,
  [Emotion.Surprised]: 2,
}

/** 解析情绪: 优先 event 覆盖，其次 state 映射，默认 Neutral */
export function resolveEmotion(state: string, event?: string): Emotion {
  if (event && EVENT_EMOTION[event]) {
    return EVENT_EMOTION[event]
  }
  return STATE_EMOTION[state] ?? Emotion.Neutral
}
