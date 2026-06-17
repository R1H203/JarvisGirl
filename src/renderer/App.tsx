import React, { useEffect, useRef } from 'react'
import { PlatformProvider } from './platform/PlatformProvider'
import { PetCanvas } from './components/PetCanvas'
import { DebugOverlay } from './components/DebugOverlay'
import { LoadingScreen } from './components/LoadingScreen'
import { useConfig } from './hooks/useConfig'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { AnimationManager } from './managers/AnimationManager'
import { useAnimationFrame } from './hooks/useAnimationFrame'
import { logger } from './utils/logger'

const AppContent: React.FC = () => {
  const { loaded } = useConfig()
  const animManagerRef = useRef<AnimationManager | null>(null)

  // Initialize keyboard shortcuts
  useKeyboardShortcuts()

  // Initialize AnimationManager
  useEffect(() => {
    if (!loaded) return

    const manager = new AnimationManager()
    animManagerRef.current = manager
    manager.start()
    logger.info('App: initialized')

    return () => {
      manager.stop()
      animManagerRef.current = null
    }
  }, [loaded])

  // Animation frame loop - delegates to AnimationManager
  useAnimationFrame(
    (deltaTime, elapsed) => {
      animManagerRef.current?.update(deltaTime, elapsed)
    },
    60,
    loaded
  )

  if (!loaded) {
    return <LoadingScreen />
  }

  return (
    <>
      <PetCanvas />
      <DebugOverlay />
    </>
  )
}

const App: React.FC = () => {
  return (
    <PlatformProvider>
      <AppContent />
    </PlatformProvider>
  )
}

export default App
