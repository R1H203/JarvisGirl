// Use electron APIs via global references to avoid module resolution conflicts
// with the npm "electron" package when running inside Electron
const { app, BrowserWindow, shell, screen, ipcMain, nativeImage, Tray, Menu } = require('electron') as typeof import('electron')

import { join } from 'path'
import { readFileSync, writeFileSync, watchFile } from 'fs'
import { createMainWindow, getWindow } from './window'
import { registerIpcHandlers } from './ipc'
import { createTray } from './tray'
import { electronStore } from './store'

// Inlined from @electron-toolkit/utils
const isDev = !app.isPackaged

app.whenReady().then(() => {
  app.setAppUserModelId('com.jarvisgirl.desktop')

  const mainWindow = createMainWindow()
  registerIpcHandlers(mainWindow)
  createTray(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Desktop pet: keep running in tray
  }
})

app.on('before-quit', () => {
  // Clean exit
})
