export function isWindows(): boolean {
  return navigator.platform.toLowerCase().includes('win')
}

export function isMacOS(): boolean {
  return navigator.platform.toLowerCase().includes('mac')
}

export async function getDPI(): Promise<number> {
  return window.devicePixelRatio || 1
}

export async function getScreenSize(): Promise<{ width: number; height: number }> {
  return {
    width: window.screen.width,
    height: window.screen.height
  }
}

export async function getAvailableMonitors(): Promise<Electron.Display[]> {
  try {
    return await window.api.getMonitors()
  } catch {
    return []
  }
}
