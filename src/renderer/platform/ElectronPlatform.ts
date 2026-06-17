import { BasePlatformAdapter } from './PlatformAdapter'
import type { MonitorInfo, AppConfig } from './types'

/**
 * ElectronPlatform — implements IPlatformAdapter using Electron's contextBridge API.
 *
 * Window:   window.api (preload → ipcRenderer)
 * Config:   window.api IPC
 * Store:    window.api IPC
 * System:   window.api IPC
 * Shell:    window.api IPC → shell.openExternal
 *
 * Note: Requires window.api (from preload/index.ts) to be available.
 * This implementation is for future use when Electron runtime issues are resolved.
 */
export class ElectronPlatform extends BasePlatformAdapter {
  readonly name = 'electron' as const

  private get api() {
    if (!window.api) {
      throw new Error(
        'ElectronPlatform: window.api not available. ' +
        'Make sure the preload script exposes the api object via contextBridge.'
      )
    }
    return window.api
  }

  window = {
    startDrag: async () => {
      await this.api.startDrag()
    },

    getPosition: async () => {
      const rect = await this.api.getWindowPosition()
      if (!rect) return null
      return { x: rect.x, y: rect.y }
    },

    setPosition: async (x: number, y: number) => {
      await this.api.setWindowPosition(x, y)
    },

    setAlwaysOnTop: async (flag: boolean) => {
      await this.api.setAlwaysOnTop(flag)
    },

    togglePenetration: async () => {
      return await this.api.togglePenetration()
    },

    toggleDevTools: async () => {
      await this.api.toggleDevTools()
    },

    minimize: async () => {
      // Electron: minimize via window control
      await this.api.setWindowPosition(-9999, -9999)  // Hide off-screen as fallback
    },

    show: async () => {
      // Electron: IPC to main to show window
      await this.api.setWindowPosition(
        (await this.api.storeGet('windowPosition') as any)?.x || 0,
        (await this.api.storeGet('windowPosition') as any)?.y || 0
      )
    },

    hide: async () => {
      await this.api.setWindowPosition(-9999, -9999)  // Move off-screen
    }
  }

  config = {
    get: async (): Promise<AppConfig> => {
      return await this.api.getConfig()
    },

    getPath: async (): Promise<string> => {
      return await this.api.getConfigPath()
    },

    save: async (partial: Partial<AppConfig>): Promise<boolean> => {
      return await this.api.saveConfig(partial as Record<string, unknown>)
    },

    onChange: (callback: (config: AppConfig) => void): (() => void) => {
      return this.api.onConfigChanged((config) => {
        callback(config as AppConfig)
      })
    }
  }

  store = {
    get: async (key: string): Promise<unknown> => {
      return await this.api.storeGet(key)
    },

    set: async (key: string, value: unknown): Promise<void> => {
      await this.api.storeSet(key, value)
    }
  }

  system = {
    getMonitors: async (): Promise<MonitorInfo[]> => {
      const monitors = await this.api.getMonitors()
      return monitors.map((m: any) => ({
        id: m.id,
        bounds: m.bounds || m.workArea,
        workArea: m.workArea,
        scaleFactor: m.scaleFactor || 1
      }))
    },

    getDPI: async (): Promise<number> => {
      return window.devicePixelRatio || 1
    }
  }

  app = {
    quit: async () => {
      window.close()
    },

    getVersion: async (): Promise<string> => {
      const pkg = await import('../../../package.json')
      return pkg.version || '0.0.0'
    }
  }

  shell = {
    openExternal: async (url: string) => {
      window.open(url, '_blank')
    }
  }
}
