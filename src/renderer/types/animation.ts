export interface BreathConfig {
  amplitude: number
  cycleMs: number
  scaleMax: number
  easing: string
}

export interface BlinkConfig {
  minIntervalMs: number
  maxIntervalMs: number
  durationMs: number
}

export interface HoverConfig {
  scale: number
  delayMs: number
}

export interface ClickConfig {
  compress: number
  overshoot: number
  recoveryMs: number
}

export interface AnimationParams {
  breathPhase: number
  breathScale: number
  isBlinking: boolean
  blinkProgress: number
  hoverScale: number
  eyeTargetX: number
  eyeTargetY: number
  headTiltX: number
  headTiltY: number
  clickScale: number
  isClickActive: boolean
  earWigglePhase: number
  tailWagPhase: number
  tailWagAmplitude: number
}
