// ── Platform Adapter Types ──
// All platform-specific types live here. Platform implementations
// (TauriPlatform, ElectronPlatform) provide these types.

export interface MonitorInfo {
  id: number
  bounds: { x: number; y: number; width: number; height: number }
  workArea: { x: number; y: number; width: number; height: number }
  scaleFactor: number
}

export interface WindowPosition {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface AppConfig {
  [key: string]: unknown
}
