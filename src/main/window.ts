import { BrowserWindow, screen, app } from 'electron'
import { join } from 'path'
import { electronStore } from './store'

let mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow {
  const savedPos = electronStore.get('windowPosition')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize

  const windowOpts: Electron.BrowserWindowConstructorOptions = {
    width: 400,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      backgroundThrottling: false,
      sandbox: false
    }
  }

  if (savedPos) {
    // Validate saved position is on an existing display
    const displays = screen.getAllDisplays()
    const onDisplay = displays.find(
      (d) =>
        savedPos.x >= d.workArea.x &&
        savedPos.x < d.workArea.x + d.workArea.width &&
        savedPos.y >= d.workArea.y &&
        savedPos.y < d.workArea.y + d.workArea.height
    )
    if (onDisplay) {
      windowOpts.x = savedPos.x
      windowOpts.y = savedPos.y
    } else {
      windowOpts.x = screenW - 420
      windowOpts.y = Math.floor(screenH / 2 - 300)
    }
  } else {
    windowOpts.x = screenW - 420
    windowOpts.y = Math.floor(screenH / 2 - 300)
  }

  mainWindow = new BrowserWindow(windowOpts)

  // Save position on move (debounced)
  let moveTimer: ReturnType<typeof setTimeout> | null = null
  mainWindow.on('move', () => {
    if (moveTimer) clearTimeout(moveTimer)
    moveTimer = setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const bounds = mainWindow.getBounds()
        electronStore.set('windowPosition', { x: bounds.x, y: bounds.y })
      }
    }, 500)
  })

  // Windows 11 Mica backdrop if available
  if (process.platform === 'win32') {
    try {
      mainWindow.setBackgroundMaterial('mica')
    } catch {
      // Fallback: transparent window handles it
    }
  }

  return mainWindow
}

export function getWindow(): BrowserWindow | null {
  return mainWindow
}
