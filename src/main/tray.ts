import { Tray, Menu, nativeImage, BrowserWindow, app } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

export function createTray(mainWindow: BrowserWindow): void {
  const iconPath = join(__dirname, '../../resources/tray-icon.png')

  let trayIcon: Electron.NativeImage
  try {
    trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  } catch {
    // Create a minimal 16x16 transparent PNG buffer if icon missing
    // 1x1 transparent pixel
    const buf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAdSURBVDhPY2RgYPjPQA1gYmRk+M9ADWBhZKgBAOQAAf8Pm0FnAAAAAElFTkSuQmCC',
      'base64'
    )
    trayIcon = nativeImage.createFromBuffer(buf)
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('JarvisGirl')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示',
      click: () => {
        mainWindow.show()
        mainWindow.setSkipTaskbar(false)
      }
    },
    {
      label: '隐藏',
      click: () => {
        mainWindow.hide()
        mainWindow.setSkipTaskbar(true)
      }
    },
    { type: 'separator' },
    {
      label: '鼠标穿透',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        const enabled = menuItem.checked
        mainWindow.setIgnoreMouseEvents(enabled, { forward: true })
      }
    },
    { type: 'separator' },
    {
      label: '开发者工具',
      click: () => {
        mainWindow.webContents.toggleDevTools()
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  // Left-click: toggle window visibility
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide()
      mainWindow.setSkipTaskbar(true)
    } else {
      mainWindow.show()
      mainWindow.setSkipTaskbar(false)
      mainWindow.focus()
    }
  })
}
