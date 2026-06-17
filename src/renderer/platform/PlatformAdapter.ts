import type { MonitorInfo, WindowPosition, AppConfig } from './types'

/**
 * PlatformAdapter — abstraction layer between business logic and runtime.
 *
 * All platform-specific APIs (window, config, store, system) go through
 * this interface. The renderer layer never calls Electron, Tauri, or
 * window.api directly.
 *
 * Implementations:
 *   - TauriPlatform  (Tauri v2 via @tauri-apps/api)
 *   - ElectronPlatform (Electron via contextBridge/preload)
 *   - WebPlatform    (future: browser-based development)
 */
export interface IPlatformAdapter {
  readonly name: 'tauri' | 'electron' | 'web'

  /** Window operations */
  window: {
    /** Start dragging the window (pointer follow) */
    startDrag: () => Promise<void>

    /** Get current window position */
    getPosition: () => Promise<WindowPosition | null>

    /** Set window position */
    setPosition: (x: number, y: number) => Promise<void>

    /** Toggle always-on-top */
    setAlwaysOnTop: (flag: boolean) => Promise<void>

    /** Toggle mouse-through mode. Returns new state. */
    togglePenetration: () => Promise<boolean>

    /** Toggle DevTools */
    toggleDevTools: () => Promise<void>

    /** Minimize */
    minimize: () => Promise<void>

    /** Show window */
    show: () => Promise<void>

    /** Hide window */
    hide: () => Promise<void>
  }

  /** Runtime config */
  config: {
    /** Load full config */
    get: () => Promise<AppConfig>

    /** Get config file path (for display) */
    getPath: () => Promise<string>

    /** Save partial config */
    save: (partial: Partial<AppConfig>) => Promise<boolean>

    /** Subscribe to config file changes. Returns unsubscribe fn. */
    onChange: (callback: (config: AppConfig) => void) => () => void
  }

  /** Persistent key-value store */
  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
  }

  /** System info */
  system: {
    getMonitors: () => Promise<MonitorInfo[]>
    getDPI: () => Promise<number>
  }

  /** App lifecycle */
  app: {
    quit: () => Promise<void>
    getVersion: () => Promise<string>
  }

  /** Shell operations */
  shell: {
    openExternal: (url: string) => Promise<void>
  }
}

/** Abstract base class with defaults */
export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly name: 'tauri' | 'electron' | 'web'

  abstract window: IPlatformAdapter['window']

  config: IPlatformAdapter['config'] = {
    get: async () => ({}),
    getPath: async () => '',
    save: async () => false,
    onChange: () => (() => {})
  }

  store: IPlatformAdapter['store'] = {
    get: async () => null,
    set: async () => {}
  }

  system: IPlatformAdapter['system'] = {
    getMonitors: async () => [],
    getDPI: async () => window.devicePixelRatio || 1
  }

  app: IPlatformAdapter['app'] = {
    quit: async () => {},
    getVersion: async () => '0.0.0'
  }

  shell: IPlatformAdapter['shell'] = {
    openExternal: async () => {}
  }
}
