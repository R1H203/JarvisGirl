import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { IPlatformAdapter } from './PlatformAdapter'
import { TauriPlatform } from './TauriPlatform'
import { logger } from '../utils/logger'

const PlatformContext = createContext<IPlatformAdapter | null>(null)

/**
 * Auto-detect which platform we're running on and create the matching adapter.
 */
function detectPlatform(): IPlatformAdapter {
  // Check for Tauri
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    logger.info('Platform: Tauri detected')
    return new TauriPlatform()
  }

  // Check for Electron
  if (typeof window !== 'undefined' && window.api) {
    logger.info('Platform: Electron detected')
    const { ElectronPlatform } = require('./ElectronPlatform')
    return new ElectronPlatform()
  }

  // Web fallback (dev mode)
  logger.info('Platform: Web fallback (no native runtime detected)')
  const { WebPlatform } = require('./WebPlatform')
  return new WebPlatform()
}

interface PlatformProviderProps {
  children: ReactNode
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  const [platform, setPlatform] = useState<IPlatformAdapter | null>(null)

  useEffect(() => {
    const adapter = detectPlatform()
    setPlatform(adapter)
    logger.info(`Platform adapter initialized: ${adapter.name}`)
  }, [])

  if (!platform) {
    // Still initializing
    return null
  }

  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  )
}

/**
 * Hook to access the platform adapter.
 * Must be used within a PlatformProvider.
 */
export function usePlatform(): IPlatformAdapter {
  const platform = useContext(PlatformContext)
  if (!platform) {
    throw new Error(
      'usePlatform() must be used within a <PlatformProvider>. ' +
      'Wrap your app root with <PlatformProvider>.'
    )
  }
  return platform
}
