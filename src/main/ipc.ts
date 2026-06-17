import { ipcMain, BrowserWindow, app, screen } from 'electron'
import { readFileSync, writeFileSync, watchFile } from 'fs'
import { join } from 'path'
import { electronStore } from './store'

const isDev = !app.isPackaged

let configWatcherInitialized = false

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // --- Config ---
  ipcMain.handle('config:get', () => {
    const configPath = getConfigPath()
    try {
      const raw = readFileSync(configPath, 'utf-8')
      return JSON.parse(raw)
    } catch {
      return {}
    }
  })

  ipcMain.handle('config:get-path', () => {
    return getConfigPath()
  })

  ipcMain.handle('config:save', (_event, partial: Record<string, unknown>) => {
    const configPath = getConfigPath()
    try {
      const raw = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(raw)
      const merged = deepMerge(config, partial)
      writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf-8')
      return true
    } catch {
      return false
    }
  })

  // Start watching config for hot-reload
  if (!configWatcherInitialized) {
    configWatcherInitialized = true
    const configPath = getConfigPath()
    try {
      watchFile(configPath, { interval: 1000 }, () => {
        if (!mainWindow.isDestroyed()) {
          try {
            const raw = readFileSync(configPath, 'utf-8')
            const config = JSON.parse(raw)
            mainWindow.webContents.send('config:changed', config)
          } catch {
            // Ignore parse errors during write
          }
        }
      })
    } catch {
      // File watching not available (packaged app)
    }
  }

  // --- Window ---
  ipcMain.handle('window:get-position', () => {
    if (mainWindow.isDestroyed()) return null
    return mainWindow.getBounds()
  })

  ipcMain.handle('window:set-position', (_event, { x, y }: { x: number; y: number }) => {
    if (mainWindow.isDestroyed()) return
    mainWindow.setBounds({ x, y })
  })

  ipcMain.handle('window:start-drag', () => {
    if (mainWindow.isDestroyed()) return
    mainWindow.startDrag()
  })

  let penetrationEnabled = false
  ipcMain.handle('window:toggle-penetration', () => {
    penetrationEnabled = !penetrationEnabled
    mainWindow.setIgnoreMouseEvents(penetrationEnabled, { forward: true })
    return penetrationEnabled
  })

  ipcMain.handle('window:toggle-devtools', () => {
    if (mainWindow.isDestroyed()) return
    mainWindow.webContents.toggleDevTools()
  })

  ipcMain.handle('window:set-always-on-top', (_event, flag: boolean) => {
    if (mainWindow.isDestroyed()) return
    mainWindow.setAlwaysOnTop(flag)
  })

  // --- Store ---
  ipcMain.handle('store:get', (_event, key: string) => {
    return electronStore.get(key as keyof PersistedStore)
  })

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    electronStore.set(key as keyof PersistedStore, value)
  })

  // --- System ---
  ipcMain.handle('system:get-monitors', () => {
    return screen.getAllDisplays().map((d) => ({
      id: d.id,
      bounds: d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor
    }))
  })
}

function getConfigPath(): string {
  if (isDev) {
    return join(app.getAppPath(), 'config', 'config.json')
  }
  return join(process.resourcesPath, 'config', 'config.json')
}

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>
): T {
  const output = { ...target }
  for (const key of Object.keys(source) as Array<keyof T>) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      output[key] = deepMerge(
        output[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      ) as T[keyof T]
    } else if (source[key] !== undefined) {
      output[key] = source[key] as T[keyof T]
    }
  }
  return output
}

type PersistedStore = ReturnType<typeof electronStore.get>
