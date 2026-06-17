/**
 * StateMachine — 最小化状态机
 *
 * 状态: idle → listening → speaking → reacting → idle
 * 职责: 管理/校验状态转换，通过 EventBus 广播状态变更
 */

import { eventBus } from './eventBus'

/** 桌宠状态枚举 */
export enum PetState {
  Idle = 'idle',
  Listening = 'listening',
  Speaking = 'speaking',
  Reacting = 'reacting',
}

/** 允许的状态转换表 (无 if-else) */
const TRANSITIONS: Record<PetState, PetState[]> = {
  [PetState.Idle]: [PetState.Listening, PetState.Reacting],
  [PetState.Listening]: [PetState.Speaking, PetState.Idle],
  [PetState.Speaking]: [PetState.Idle, PetState.Reacting],
  [PetState.Reacting]: [PetState.Idle, PetState.Speaking],
}

/** 默认初始状态 */
const DEFAULT_STATE = PetState.Idle

class StateMachine {
  private _state: PetState = DEFAULT_STATE

  /** 获取当前状态 */
  get state(): PetState {
    return this._state
  }

  /** 尝试切换到目标状态，非法转换将被忽略（并 console.warn） */
  setState(target: PetState): boolean {
    if (target === this._state) return true

    const allowed = TRANSITIONS[this._state]
    if (!allowed || !allowed.includes(target)) {
      console.warn(
        `[StateMachine] 非法转换: ${this._state} → ${target}，允许: [${allowed?.join(', ')}]`
      )
      return false
    }

    const prev = this._state
    this._state = target
    console.log(`[StateMachine] ${prev} → ${target}`)

    // 通过 EventBus 广播状态变更
    eventBus.emit('state:change', { prev, current: target })
    eventBus.emit(`state:${target}`, { prev })

    return true
  }

  /** 重置到指定状态（默认 Idle，跳过合法性校验） */
  reset(state: PetState = DEFAULT_STATE): void {
    const prev = this._state
    this._state = state
    console.log(`[StateMachine] reset: ${prev} → ${state}`)
    eventBus.emit('state:change', { prev, current: state })
    eventBus.emit(`state:${state}`, { prev })
  }
}

/** 全局单例 */
export const stateMachine = new StateMachine()
