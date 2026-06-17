import { BasePlatformAdapter } from './PlatformAdapter'
import type { AppConfig } from './types'

/**
 * WebPlatform — for browser-based development.
 *
 * Window:   no-ops (browser has no drag/penetration)
 * Config:   localStorage
 * Store:    localStorage
 * System:   navigator / screen APIs
 * Shell:    window.open
 */
export class WebPlatform extends BasePlatformAdapter {
  readonly name = 'web' as const

  window = {
    startDrag: async () => {
      // No-op in browser
    },

    getPosition: async () => null,

    setPosition: async () => {},

    setAlwaysOnTop: async () => {},

    togglePenetration: async () => false,

    toggleDevTools: async () => {
      // Browser dev tools
    },

    minimize: async () => {},

    show: async () => {},

    hide: async () => {}
  }

  config = {
    get: async (): Promise<AppConfig> => {
      try {
        const raw = localStorage.getItem('jarvisgirl-config')
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    },

    getPath: async (): Promise<string> => {
      return 'localStorage'
    },

    save: async (partial: Partial<AppConfig>): Promise<boolean> => {
      try {
        const current = await this.config.get()
        const merged = { ...current, ...partial }
        localStorage.setItem('jarvisgirl-config', JSON.stringify(merged))
        return true
      } catch {
        return false
      }
    },

    onChange: (): (() => void) => {
      return () => {}
    }
  }

  store = {
    get: async (key: string): Promise<unknown> => {
      try {
        const raw = localStorage.getItem(`jarvisgirl-${key}`)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },

    set: async (key: string, value: unknown): Promise<void> => {
      localStorage.setItem(`jarvisgirl-${key}`, JSON.stringify(value))
    }
  }

  system = {
    getMonitors: async () => {
      return [
        {
          id: 0,
          bounds: {
            x: 0,
            y: 0,
            width: window.screen.width,
            height: window.screen.height
          },
          workArea: {
            x: 0,
            y: 0,
            width: window.screen.availWidth,
            height: window.screen.availHeight
          },
          scaleFactor: window.devicePixelRatio || 1
        }
      ]
    },

    getDPI: async () => window.devicePixelRatio || 1
  }

  shell = {
    openExternal: async (url: string) => {
      window.open(url, '_blank', 'noopener')
    }
  }
}
