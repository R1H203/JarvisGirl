import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import { logger } from '../utils/logger'

class AIService {
  private isListening = false

  async sendMessage(text: string): Promise<string> {
    logger.info(`AI: sendMessage called (stub): "${text.slice(0, 50)}..."`)
    eventBus.emit(PetEvent.AI_START, { text })

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const response = `这是对"${text}"的模拟回复。AI 服务尚未接入。`
    eventBus.emit(PetEvent.AI_END, { text: response })
    logger.info('AI: response emitted (stub)')

    return response
  }

  async startListen(): Promise<void> {
    this.isListening = true
    logger.info('AI: startListen (stub)')
    eventBus.emit(PetEvent.CLICK, {
      x: 0,
      y: 0,
      screenX: 0,
      screenY: 0
    })
  }

  stopListen(): void {
    this.isListening = false
    logger.info('AI: stopListen (stub)')
  }

  async receiveMessage(): Promise<string> {
    logger.info('AI: receiveMessage (stub)')
    return '这是一条模拟消息。'
  }
}

export const aiService = new AIService()
