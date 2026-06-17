import { PetEvent, EventPayloadMap } from '../types/events'
import { logger } from '../utils/logger'

type Listener<E extends PetEvent> = (payload: EventPayloadMap[E]) => void

class TypedEventBus {
  private listeners = new Map<PetEvent, Set<Listener<any>>>()
  private onceListeners = new Map<PetEvent, Set<Listener<any>>>()

  on<E extends PetEvent>(event: E, fn: Listener<E>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(fn)

    return () => {
      this.listeners.get(event)?.delete(fn)
    }
  }

  once<E extends PetEvent>(event: E, fn: Listener<E>): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }
    this.onceListeners.get(event)!.add(fn)
  }

  emit<E extends PetEvent>(event: E, payload: EventPayloadMap[E]): void {
    const regular = this.listeners.get(event)
    if (regular) {
      regular.forEach((fn) => {
        try {
          fn(payload)
        } catch (err) {
          logger.error(`EventBus: error in listener for ${event}`, err)
        }
      })
    }

    const once = this.onceListeners.get(event)
    if (once) {
      once.forEach((fn) => {
        try {
          fn(payload)
        } catch (err) {
          logger.error(`EventBus: error in once-listener for ${event}`, err)
        }
      })
      this.onceListeners.delete(event)
    }

    logger.debug(`EventBus: ${event} emitted`)
  }

  off<E extends PetEvent>(event: E, fn: Listener<E>): void {
    this.listeners.get(event)?.delete(fn)
    this.onceListeners.get(event)?.delete(fn)
  }

  clear(): void {
    this.listeners.clear()
    this.onceListeners.clear()
  }
}

export const eventBus = new TypedEventBus()
