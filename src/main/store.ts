import ElectronStore from 'electron-store'

interface PersistedStore {
  windowPosition: { x: number; y: number }
  configOverrides: Record<string, unknown>
  characterName: string
}

export const electronStore = new ElectronStore<PersistedStore>({
  defaults: {
    windowPosition: { x: 0, y: 0 },
    configOverrides: {},
    characterName: 'default'
  }
})
