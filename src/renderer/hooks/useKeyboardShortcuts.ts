import { useEffect } from 'react'
import { useDebugStore } from '../stores/debugStore'

// Lazily resolved platform reference for keyboard shortcuts
let platformWindow: import('../platform/PlatformAdapter').IPlatformAdapter['window'] | null = null

async function getPlatformWindow() {
  if (!platformWindow) {
    try {
      const { TauriPlatform } = await import('../platform/TauriPlatform')
      platformWindow = new TauriPlatform().window
    } catch {
      // Not in Tauri
    }
  }
  return platformWindow
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      // F12: DevTools
      if (e.key === 'F12') {
        e.preventDefault()
        getPlatformWindow().then((w) => w?.toggleDevTools())
        return
      }

      // Ctrl+Shift+D: Debug overlay
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        useDebugStore.getState().toggle()
        return
      }

      // Ctrl+Shift+H: Hitbox
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        useDebugStore.getState().toggleHitbox()
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
