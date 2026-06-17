import { PetState, Expression } from '../types/pet'
import { usePetStore } from '../stores/petStore'
import { useAnimationStore } from '../stores/animationStore'
import { useInteractionStore } from '../stores/interactionStore'
import { useConfigStore } from '../stores/configStore'
import { useDebugStore } from '../stores/debugStore'
import { eventBus } from '../events/EventBus'
import { PetEvent } from '../types/events'
import { logger } from '../utils/logger'
import {
  DEFAULT_BREATH_CYCLE_MS,
  DEFAULT_BREATH_AMPLITUDE,
  DEFAULT_BREATH_SCALE_MAX,
  BLINK_MIN_INTERVAL,
  BLINK_MAX_INTERVAL,
  BLINK_DURATION_MS,
  HOVER_SCALE,
  CLICK_COMPRESS,
  CLICK_OVERSHOOT,
  CLICK_RECOVERY_MS,
  SLEEP_TIMEOUT_MS,
  ACTIVE_FPS,
  IDLE_FPS,
  SLEEP_FPS
} from '../utils/constants'

export class AnimationManager {
  private breathPhase = 0
  private blinkTimer: ReturnType<typeof setTimeout> | null = null
  private sleepTimer: ReturnType<typeof setTimeout> | null = null
  private clickPhase = 0
  private clickActive = false
  private frameCount = 0
  private fpsTimer = 0
  private currentFps = 0
  private cleanupFns: (() => void)[] = []

  start(): void {
    this.scheduleBlink()
    this.scheduleSleep()

    // Subscribe to events
    this.cleanupFns.push(
      eventBus.on(PetEvent.CLICK, () => this.onClick()),
      eventBus.on(PetEvent.SLEEP, () => this.onSleep()),
      eventBus.on(PetEvent.WAKE, () => this.onWake()),
      eventBus.on(PetEvent.AI_START, () => this.onAIStart()),
      eventBus.on(PetEvent.AI_END, () => this.onAIEnd())
    )

    logger.info('AnimationManager started')
  }

  stop(): void {
    if (this.blinkTimer) clearTimeout(this.blinkTimer)
    if (this.sleepTimer) clearTimeout(this.sleepTimer)
    this.cleanupFns.forEach((fn) => fn())
    this.cleanupFns = []
  }

  /** Called each frame from useAnimationFrame */
  update(deltaTime: number, elapsed: number): void {
    this.frameCount++
    const state = usePetStore.getState().state
    const config = useConfigStore.getState().config
    const interaction = useInteractionStore.getState()

    // FPS tracking
    if (elapsed - this.fpsTimer >= 1000) {
      this.currentFps = this.frameCount
      this.frameCount = 0
      this.fpsTimer = elapsed
      useDebugStore.getState().updateMetrics(this.currentFps, deltaTime)
    }

    // Breath
    const breathCycle = config?.breath?.cycleMs ?? DEFAULT_BREATH_CYCLE_MS
    const breathAmp = config?.breath?.amplitude ?? DEFAULT_BREATH_AMPLITUDE
    const breathScaleMax = config?.breath?.scaleMax ?? DEFAULT_BREATH_SCALE_MAX
    const speedMultiplier = this.getBreathSpeedMultiplier(state)

    this.breathPhase += ((2 * Math.PI) / breathCycle) * deltaTime * speedMultiplier
    if (this.breathPhase > Math.PI * 2) this.breathPhase -= Math.PI * 2

    const breathScale = 1 + Math.sin(this.breathPhase) * (breathScaleMax - 1)
    const breathVertical = Math.sin(this.breathPhase) * breathAmp

    // Ear wiggle synced to breath
    const earPhase = this.breathPhase

    // Tail wag
    const tailAmp = this.getTailAmplitude(state)
    const tailSpeed = this.getTailSpeed(state)
    const tailPhase = this.breathPhase * tailSpeed

    useAnimationStore.getState().updateBreath(this.breathPhase, breathScale, breathVertical)
    useAnimationStore.getState().setAppendage(earPhase, tailPhase, tailAmp)

    // Hover
    if (interaction.isHovering) {
      const hoverScale = HOVER_SCALE
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight
      const deltaX = (interaction.mouseX - centerX) / centerX
      const deltaY = (interaction.mouseY - centerY) / centerY

      useAnimationStore.getState().setHover(
        hoverScale,
        deltaX * 8,
        deltaY * 6,
        deltaX * 2,
        deltaY * 1
      )
    } else if (!this.clickActive) {
      useAnimationStore.getState().setHover(1, 0, 0, 0, 0)
    }

    // Click animation
    if (this.clickActive) {
      this.clickPhase += deltaTime
      const progress = this.clickPhase / CLICK_RECOVERY_MS

      if (progress < 0.3) {
        // Compress phase
        const t = progress / 0.3
        const scale = 1 - (1 - CLICK_COMPRESS) * t
        useAnimationStore.getState().setClick(scale, true)
      } else if (progress < 0.6) {
        // Overshoot phase
        const t = (progress - 0.3) / 0.3
        const scale = CLICK_COMPRESS + (CLICK_OVERSHOOT - CLICK_COMPRESS) * t
        useAnimationStore.getState().setClick(scale, true)
      } else if (progress < 1) {
        // Recover phase
        const t = (progress - 0.6) / 0.4
        const scale = CLICK_OVERSHOOT + (1 - CLICK_OVERSHOOT) * t
        useAnimationStore.getState().setClick(scale, true)
      } else {
        this.clickActive = false
        useAnimationStore.getState().setClick(1, false)
        this.clickPhase = 0
      }
    }

    // Reset sleep timer on interaction
    if (interaction.isHovering || this.clickActive) {
      this.resetSleepTimer()
    }
  }

  /** Get the target FPS for the current state */
  getTargetFps(): number {
    const state = usePetStore.getState().state
    const config = useConfigStore.getState().config

    if (state === PetState.Sleeping) {
      return config?.performance?.sleepFps ?? SLEEP_FPS
    }
    if (
      state === PetState.Idle &&
      !useInteractionStore.getState().isHovering
    ) {
      return config?.performance?.idleFps ?? IDLE_FPS
    }
    return config?.performance?.activeFps ?? ACTIVE_FPS
  }

  // ── Private ──

  private getBreathSpeedMultiplier(state: PetState): number {
    switch (state) {
      case PetState.Sleeping:
        return 0.5
      case PetState.Thinking:
      case PetState.Error:
        return 0.8
      default:
        return 1
    }
  }

  private getTailAmplitude(state: PetState): number {
    switch (state) {
      case PetState.Sleeping:
        return 0
      case PetState.Idle:
        return 5
      default:
        return 8
    }
  }

  private getTailSpeed(state: PetState): number {
    switch (state) {
      case PetState.Sleeping:
        return 0
      case PetState.Idle:
        return 0.5
      default:
        return 1
    }
  }

  private scheduleBlink(): void {
    const min = BLINK_MIN_INTERVAL
    const max = BLINK_MAX_INTERVAL
    const delay = min + Math.random() * (max - min)

    this.blinkTimer = setTimeout(() => {
      useAnimationStore.getState().setBlink(true, 0)

      // Animate blink over BLINK_DURATION_MS
      const startTime = performance.now()
      const blinkDuration = BLINK_DURATION_MS
      const blinkLoop = (now: number): void => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / blinkDuration, 1)

        if (progress < 0.4) {
          // Closing
          useAnimationStore.getState().setBlink(true, progress / 0.4)
        } else if (progress < 0.6) {
          // Closed
          useAnimationStore.getState().setBlink(true, 1)
        } else {
          // Opening
          useAnimationStore.getState().setBlink(true, 1 - (progress - 0.6) / 0.4)
        }

        if (progress < 1) {
          requestAnimationFrame(blinkLoop)
        } else {
          useAnimationStore.getState().setBlink(false, 0)
        }
      }

      requestAnimationFrame(blinkLoop)
      this.scheduleBlink()
    }, delay)
  }

  private scheduleSleep(manualTimeout?: number): void {
    if (this.sleepTimer) clearTimeout(this.sleepTimer)

    const timeout = manualTimeout ?? SLEEP_TIMEOUT_MS

    this.sleepTimer = setTimeout(() => {
      const state = usePetStore.getState().state
      if (state === PetState.Idle) {
        usePetStore.getState().transition(PetState.Sleeping)
      }
    }, timeout)
  }

  private resetSleepTimer(): void {
    this.scheduleSleep(SLEEP_TIMEOUT_MS)
  }

  private onClick(): void {
    this.clickActive = true
    this.clickPhase = 0

    // Set happy expression temporarily
    usePetStore.getState().setExpression(Expression.Happy)

    // Reset expression after 800ms
    setTimeout(() => {
      const state = usePetStore.getState().state
      usePetStore.getState().setExpression(
        state === PetState.Sleeping ? Expression.Sleep : Expression.Normal
      )
    }, 800)

    this.resetSleepTimer()
  }

  private onSleep(): void {
    usePetStore.getState().transition(PetState.Sleeping)
  }

  private onWake(): void {
    if (usePetStore.getState().state === PetState.Sleeping) {
      usePetStore.getState().transition(PetState.Idle)
    }
    this.resetSleepTimer()
  }

  private onAIStart(): void {
    usePetStore.getState().transition(PetState.Thinking)
  }

  private onAIEnd(): void {
    usePetStore.getState().transition(PetState.Talking)
  }
}
