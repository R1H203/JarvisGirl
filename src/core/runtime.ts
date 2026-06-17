/**
 * Runtime — 统一初始化入口
 *
 * 职责:
 *   - 初始化 EventBus
 *   - 初始化 StateMachine
 *   - 挂载全局事件日志（开发时可用）
 *   - 提供运行时状态查询
 *
 * 调用时机: 应用启动后、PixiJS 初始化前
 */

import { eventBus } from './eventBus'
import { stateMachine, PetState } from './stateMachine'
import { initExpressionPipeline, getCurrentEmotion, getCurrentAction } from './expressionPipeline'
import { Emotion } from './emotion'
import { Action } from './action'

/** Dev 模式: 是否在 console 输出所有事件 */
let devLogging = false

/** 初始化运行时核心 */
export function initRuntime(options?: { devLog?: boolean }): void {
  devLogging = options?.devLog ?? true

  console.log('[Runtime] 初始化核心模块...')

  // StateMachine 已自注册到 EventBus（内部 emit state:change）
  // 这里确保初始状态广播
  stateMachine.reset(PetState.Idle)

  // 初始化 Expression Pipeline（状态→情绪→动作管道）
  initExpressionPipeline()

  if (devLogging) {
    // 挂载全局事件日志
    eventBus.on('state:change', (e) => {
      console.log(`[Runtime] 状态变更: ${e?.prev} → ${e?.current}`)
    })

    // Log 常见业务事件
    const logEvents = ['emotion', 'action', 'tts', 'interaction', 'error'] as const
    logEvents.forEach((event) => {
      eventBus.on(event, (payload) => {
        console.log(`[Runtime] 事件: ${event}`, payload)
      })
    })
  }

  console.log('[Runtime] 核心模块初始化完成')
  console.log(`[Runtime] 当前状态: ${stateMachine.state}`)

  // 导出到 window 便于调试
  if (typeof window !== 'undefined') {
    ;(window as any).__JARVIS_GIRL__ = {
      eventBus,
      stateMachine,
      PetState,
      Emotion,
      Action,
      getCurrentEmotion,
      getCurrentAction,
      dumpModelParams: undefined as (() => Record<string, number>) | undefined,
    }
  }
}

/** 运行时状态快照 */
export function getRuntimeStatus(): {
  state: string
  listenerCounts: Record<string, number>
} {
  return {
    state: stateMachine.state,
    listenerCounts: eventBus.listenerCounts,
  }
}
