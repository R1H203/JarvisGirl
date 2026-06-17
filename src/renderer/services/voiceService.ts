import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import { logger } from '../utils/logger'

class VoiceService {
  private isSpeaking = false

  async speak(text: string): Promise<void> {
    this.isSpeaking = true
    logger.info(`Voice: speak (stub): "${text.slice(0, 50)}..."`)
    eventBus.emit(PetEvent.TTS_START, { text })

    // Simulate speech duration
    await new Promise((resolve) => setTimeout(resolve, text.length * 50))

    this.isSpeaking = false
    eventBus.emit(PetEvent.TTS_END, {})
    logger.info('Voice: speech end (stub)')
  }

  stop(): void {
    this.isSpeaking = false
    logger.info('Voice: stop (stub)')
  }

  setVoice(_voiceId: string): void {
    logger.info(`Voice: setVoice (stub): "${_voiceId}"`)
  }
}

export const voiceService = new VoiceService()
