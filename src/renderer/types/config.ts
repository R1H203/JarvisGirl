export interface GlassConfig {
  opacity: number
  blur: number
  height: number
  widthRatio: number
  borderRadius: number
}

export interface ShadowConfig {
  opacity: number
  blur: number
  offsetY: number
  color: string
}

export interface AmbientLightConfig {
  brightness: number
  hue: number
  saturation: number
  blur: number
}

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

export interface ParticleConfig {
  maxCount: number
  enabledTypes: string[]
  spawnOnClick: number
  spawnOnHappy: number
  spawnOnAiReply: number
  spawnOnHover: number
  fadeDurationMs: number
}

export interface PerformanceConfig {
  activeFps: number
  idleFps: number
  sleepFps: number
  idleTimeoutMs: number
  particleFps: number
}

export interface DebugConfig {
  showFps: boolean
  showHitbox: boolean
  showState: boolean
}

export interface CharacterConfig {
  directory: string
  size: number
  anchorX: number
  anchorY: number
}

export interface AppConfig {
  character: CharacterConfig
  glass: GlassConfig
  shadow: ShadowConfig
  ambientLight: AmbientLightConfig
  breath: BreathConfig
  blink: BlinkConfig
  particles: ParticleConfig
  performance: PerformanceConfig
  debug: DebugConfig
}
