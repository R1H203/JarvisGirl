/**
 * EventBus — 最小化事件总线
 *
 * 职责: 全局 Pub/Sub，用于模块间解耦通信
 * 约束: 不依赖任何框架，纯 TypeScript
 */

type Listener<T = unknown> = (payload: T) => void

class EventBus {
  private listeners = new Map<string, Set<Listener>>()

  /** 订阅事件，返回取消订阅函数 */
  on<T = unknown>(event: string, fn: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(fn as Listener)
    return () => this.off(event, fn as Listener)
  }

  /** 取消订阅 */
  off<T = unknown>(event: string, fn: Listener<T>): void {
    this.listeners.get(event)?.delete(fn as Listener)
  }

  /** 触发事件 */
  emit<T = unknown>(event: string, payload?: T): void {
    const fns = this.listeners.get(event)
    if (!fns || fns.size === 0) return
    fns.forEach((fn) => {
      try {
        fn(payload)
      } catch (err) {
        console.error(`[EventBus] error in listener for "${event}":`, err)
      }
    })
  }

  /** 清空所有订阅 */
  clear(): void {
    this.listeners.clear()
  }

  /** 调试: 查看当前所有事件类型的订阅数 */
  get listenerCounts(): Record<string, number> {
    const counts: Record<string, number> = {}
    this.listeners.forEach((set, event) => {
      counts[event] = set.size
    })
    return counts
  }
}

/** 全局单例 */
export const eventBus = new EventBus()
