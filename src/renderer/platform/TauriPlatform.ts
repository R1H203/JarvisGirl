import { BasePlatformAdapter } from './PlatformAdapter'
import type { MonitorInfo, AppConfig } from './types'

/**
 * TauriPlatform — implements IPlatformAdapter using Tauri v2 APIs.
 *
 * Window:   @tauri-apps/api/window (getCurrentWindow)
 * Config:   Tauri IPC invoke → Rust backend reads config/config.json
 * Store:    Tauri IPC invoke → Rust backend stores in electron-store-style JSON
 * System:   @tauri-apps/api/window monitor APIs
 * Shell:    @tauri-apps/plugin-shell
 */
export class TauriPlatform extends BasePlatformAdapter {
  readonly name = 'tauri' as const

  window = {
    startDrag: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().startDragging()
    },

    getPosition: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const pos = await getCurrentWindow().outerPosition()
      return { x: pos.x, y: pos.y }
    },

    setPosition: async (x: number, y: number) => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().setPosition({ x, y })
    },

    setAlwaysOnTop: async (flag: boolean) => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().setAlwaysOnTop(flag)
    },

    togglePenetration: async () => {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke<boolean>('toggle_penetration')
      return result
    },

    toggleDevTools: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()
      if (await win.isDevToolsOpen()) {
        await win.closeDevTools()
      } else {
        await win.openDevTools()
      }
    },

    minimize: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().minimize()
    },

    show: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().show()
    },

    hide: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().hide()
    }
  }

  config = {
    get: async (): Promise<AppConfig> => {
      const { invoke } = await import('@tauri-apps/api/core')
      try {
        return await invoke<AppConfig>('config_get')
      } catch {
        return {}
      }
    },

    getPath: async (): Promise<string> => {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke<string>('config_get_path')
    },

    save: async (partial: Partial<AppConfig>): Promise<boolean> => {
      const { invoke } = await import('@tauri-apps/api/core')
      try {
        await invoke('config_save', { config: partial })
        return true
      } catch {
        return false
      }
    },

    onChange: (callback: (config: AppConfig) => void): (() => void) => {
      const { listen } = require('@tauri-apps/api/event')
      const unlistenPromise = listen<AppConfig>('config:changed', (event) => {
        callback(event.payload)
      })
      // Return unlisten function
      return () => {
        unlistenPromise.then((fn) => fn())
      }
    }
  }

  store = {
    get: async (key: string): Promise<unknown> => {
      const { invoke } = await import('@tauri-apps/api/core')
      return await invoke('store_get', { key })
    },

    set: async (key: string, value: unknown): Promise<void> => {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('store_set', { key, value })
    }
  }

  system = {
    getMonitors: async (): Promise<MonitorInfo[]> => {
      const { availableMonitors } = await import('@tauri-apps/api/window')
      const monitors = await availableMonitors()
      return monitors.map((m) => ({
        id: Number(m.name) || 0,
        bounds: {
          x: m.position.x,
          y: m.position.y,
          width: m.size.width,
          height: m.size.height
        },
        workArea: {
          x: 0,
          y: 0,
          width: m.size.width,
          height: m.size.height
        },
        scaleFactor: m.scaleFactor || 1
      }))
    },

    getDPI: async (): Promise<number> => {
      return window.devicePixelRatio || 1
    }
  }

  app = {
    quit: async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      await getCurrentWindow().close()
    },

    getVersion: async (): Promise<string> => {
      const { getVersion } = await import('@tauri-apps/api/app')
      return await getVersion()
    }
  }

  shell = {
    openExternal: async (url: string) => {
      const { open } = await import('@tauri-apps/plugin-shell')
      await open(url)
    }
  }
}
