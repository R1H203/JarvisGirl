declare global {
  interface Window {
    api: {
      getConfig: () => Promise<Record<string, unknown>>
      getConfigPath: () => Promise<string>
      saveConfig: (partial: Record<string, unknown>) => Promise<boolean>
      getWindowPosition: () => Promise<Electron.Rectangle | null>
      setWindowPosition: (x: number, y: number) => Promise<void>
      startDrag: () => Promise<void>
      togglePenetration: () => Promise<boolean>
      toggleDevTools: () => Promise<void>
      setAlwaysOnTop: (flag: boolean) => Promise<void>
      storeGet: (key: string) => Promise<unknown>
      storeSet: (key: string, value: unknown) => Promise<void>
      getMonitors: () => Promise<Electron.Display[]>
      onConfigChanged: (callback: (config: Record<string, unknown>) => void) => () => void
      removeAllListeners: (channel: string) => void
    }
  }
}

export {}
