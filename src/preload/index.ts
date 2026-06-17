import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // Config
  getConfig: (): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('config:get'),
  getConfigPath: (): Promise<string> =>
    ipcRenderer.invoke('config:get-path'),
  saveConfig: (partial: Record<string, unknown>): Promise<boolean> =>
    ipcRenderer.invoke('config:save', partial),

  // Window
  getWindowPosition: (): Promise<Electron.Rectangle | null> =>
    ipcRenderer.invoke('window:get-position'),
  setWindowPosition: (x: number, y: number): Promise<void> =>
    ipcRenderer.invoke('window:set-position', { x, y }),
  startDrag: (): Promise<void> =>
    ipcRenderer.invoke('window:start-drag'),
  togglePenetration: (): Promise<boolean> =>
    ipcRenderer.invoke('window:toggle-penetration'),
  toggleDevTools: (): Promise<void> =>
    ipcRenderer.invoke('window:toggle-devtools'),
  setAlwaysOnTop: (flag: boolean): Promise<void> =>
    ipcRenderer.invoke('window:set-always-on-top', flag),

  // Store
  storeGet: (key: string): Promise<unknown> =>
    ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: unknown): Promise<void> =>
    ipcRenderer.invoke('store:set', key, value),

  // System
  getMonitors: (): Promise<Electron.Display[]> =>
    ipcRenderer.invoke('system:get-monitors'),

  // Push events from main
  onConfigChanged: (callback: (config: Record<string, unknown>) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, config: Record<string, unknown>): void =>
      callback(config)
    ipcRenderer.on('config:changed', handler)
    return () => ipcRenderer.removeListener('config:changed', handler)
  },

  // Cleanup
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
