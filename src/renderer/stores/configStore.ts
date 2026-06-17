import { create } from 'zustand'
import type { AppConfig } from '../types/config'

interface ConfigStore {
  config: AppConfig | null
  loaded: boolean
  load: (platformConfig: {
    get: () => Promise<Record<string, unknown>>
    onChange: (cb: (config: Record<string, unknown>) => void) => () => void
  }) => Promise<void>
  updateConfig: (partial: Partial<AppConfig>) => void
  get: <K extends keyof AppConfig>(key: K) => AppConfig[K] | undefined
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  config: null,
  loaded: false,

  load: async (platformConfig) => {
    try {
      const raw = await platformConfig.get()
      set({ config: raw as unknown as AppConfig, loaded: true })
    } catch {
      set({ loaded: true })
    }

    // Watch for config changes via platform adapter
    platformConfig.onChange((raw) => {
      set({ config: raw as unknown as AppConfig })
    })
  },

  updateConfig: (partial) => {
    const current = get().config
    if (!current) return
    const merged = { ...current, ...partial }
    set({ config: merged })
  },

  get: <K extends keyof AppConfig>(key: K): AppConfig[K] | undefined => {
    return get().config?.[key]
  }
}))
